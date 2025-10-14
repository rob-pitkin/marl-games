from pettingzoo.classic import chess_v6
from src.lib.ppo import train_action_mask, eval_action_mask

if __name__ == "__main__":
    env_fn = chess_v6

    env_kwargs = {}

    # Train a model against itself
    train_action_mask(env_fn, steps=20_480, seed=0, **env_kwargs)

    # Eval 100 games against a random agent
    eval_action_mask(env_fn, num_games=100, render_mode=None, **env_kwargs)

    # Watch two games vs a random agent
    eval_action_mask(env_fn, num_games=2, render_mode="human", **env_kwargs)
