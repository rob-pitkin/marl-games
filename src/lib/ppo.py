import glob
import os
import time

from sb3_contrib import MaskablePPO
from sb3_contrib.common.maskable.policies import MaskableActorCriticPolicy
from sb3_contrib.common.wrappers import ActionMasker

from src.lib.utils import SB3ActionMaskWrapper


def mask_fn(env):
    """
    Can use any custom implementation to return the action mask for the current env.
    for us, we added the action_mask function above
    """
    return env.action_mask()


def train_action_mask(env_fn, steps=10000, seed=0, **env_kwargs):
    """
    Train a single model to play as each agent in a zero-sum game env using invalid action masking.
    """
    env = env_fn.env(**env_kwargs)

    print(f"Starting training on {str(env.metadata['name'])}.")

    # custom wrapper to convert PettingZoo envs to work with SB3 action masking
    env = SB3ActionMaskWrapper(env)

    env.reset(seed=seed)

    """
    Wrap to enable masking (SB3 function)
    MaskablePPO behaves the same as SB3's PPO unless the env is wrapped
    with ActionMasker. If the wrapper is dectected, the masks are automatically
    retrieved and used when learning.
    """
    env = ActionMasker(env, mask_fn)

    model = MaskablePPO(MaskableActorCriticPolicy, env, verbose=1)
    model.set_random_seed(seed)
    model.learn(total_timesteps=steps)

    model.save(
        f"checkpoints/{env.unwrapped.metadata.get('name')}/{env.unwrapped.metadata.get('name')}_{time.strftime('%Y%m%d-%H%M%S')}"
    )

    print("Model has been saved.")

    print(f"Finished training on {str(env.unwrapped.metadata['name'])}.\n")

    env.close()


def eval_action_mask(env_fn, num_games=100, render_mode=None, **env_kwargs):
    # Evaluate a trained agent vs a random agent
    env = env_fn.env(render_mode=render_mode, **env_kwargs)

    print(
        f"Starting evaluation vs a random agent. Trained agent will play as {env.possible_agents[1]}."
    )

    try:
        latest_policy = max(
            glob.glob(
                f"checkpoints/{env.metadata['name']}/{env.metadata['name']}*.zip"
            ),
            key=os.path.getctime,
        )
    except ValueError:
        print("Policy not found.")
        exit(0)

    model = MaskablePPO.load(latest_policy)

    scores = {agent: 0 for agent in env.possible_agents}
    total_rewards = {agent: 0 for agent in env.possible_agents}
    round_rewards = []

    for i in range(num_games):
        env.reset(seed=i)
        env.action_space(env.possible_agents[0]).seed(i)

        for agent in env.agent_iter():
            obs, reward, termination, truncation, info = env.last()

            # Separate observation and action mask
            # obs is a dict with keys "observation" and "action_mask"
            observation, action_mask = obs.values()

            if termination or truncation:
                # if there is a winner, keep track, otherwise don't change the scores (tie)
                if (
                    env.rewards[env.possible_agents[0]]
                    != env.rewards[env.possible_agents[1]]
                ):
                    winner = max(env.rewards, key=env.rewards.get)
                    # track the largers reward (winner of game)
                    scores[winner] += env.rewards[winner]
                # also track negative and positive rewards (penalizes illegal moves)
                for a in env.possible_agents:
                    total_rewards[a] += env.rewards[a]
                # list of rewards by round, for reference
                round_rewards.append(env.rewards)
                break
            else:
                # if it's the random agent's turn, take a random action
                if agent == env.possible_agents[0]:
                    act = env.action_space(agent).sample(action_mask)
                else:
                    # otherwise, use the policy to sample an action
                    act = int(
                        model.predict(
                            observation,
                            action_masks=action_mask,
                            deterministic=True,
                        )[0]
                    )
                env.step(act)
    env.close()

    # Avoid dividing by zero
    if sum(scores.values()) == 0:
        winrate = 0
    else:
        winrate = scores[env.possible_agents[1]] / sum(scores.values())
    print("Rewards by round: ", round_rewards)
    print("Total rewards (incl. negative rewards): ", total_rewards)
    print("Winrate: ", winrate)
    print("Final scores: ", scores)
    return round_rewards, total_rewards, winrate, scores
