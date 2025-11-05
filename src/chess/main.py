from pettingzoo.classic import chess_v6
from src.lib.ppo import train_action_mask, eval_action_mask
from torch.distributions import Distribution

if __name__ == "__main__":
    env_fn = chess_v6

    env_kwargs = {}

    # Disable distribution validation due to known issue: https://github.com/Stable-Baselines-Team/stable-baselines3-contrib/issues/247
    Distribution.set_default_validate_args(False)

    # Train a model against itself
    train_action_mask(env_fn, steps=20_480, seed=0, **env_kwargs)

    # Eval 100 games against a random agent
    eval_action_mask(env_fn, num_games=100, render_mode=None, **env_kwargs)

    # Watch two games vs a random agent
    eval_action_mask(env_fn, num_games=2, render_mode="human", **env_kwargs)
