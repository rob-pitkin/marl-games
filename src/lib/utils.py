import gymnasium as gym
import pettingzoo.utils


# Create a wrapper that subclasses under gym.Env as well as pettingzoo.utils.BaseWrapper
# so we can use it with SB3
class SB3ActionMaskWrapper(pettingzoo.utils.BaseWrapper, gym.Env):
    """
    Wrapper to allow PettingZoo environments to be used with SB3 illegal action masking.
    """

    def reset(self, seed=None, options=None):
        """
        Gymnasium-like reset function which assigns obs/action spaces to be the same for each agent.

        This is required as SB3 is designed for single-agent RL and doesn't expect obs/action spaces to be functions
        """
        super().reset(seed, options)

        # Strip the action mask out from the observation space
        # (python follows MRO, so super() goes current class --> pettingzoo --> gymnasium --> object)
        self.observation_space = super().observation_space(self.possible_agents[0])[
            "observation"
        ]
        self.action_space = super().action_space(self.possible_agents[0])

        # Return the inital observation, info (PettingZoo AEC envs do not by default)
        # observe returns the current available observation for the passed agent
        # agent_selection returns the currently selected agent that an action can be taken for
        return self.observe(self.agent_selection), {}

    def step(self, action):
        """
        Gymnasium-like step function, returning observation, reward, termination, truncation, info.

        The observation is for the next agent (used to determine the next action), while the remaining
        items are for the agent that just acted (used to understand what just happened).
        """
        current_agent = self.agent_selection

        # Take the action in the environment
        super().step(action)

        next_agent = self.agent_selection

        return (
            self.observe(next_agent),
            self._cumulative_rewards[current_agent],
            self.terminations[current_agent],
            self.truncations[current_agent],
            self.infos[current_agent],
        )

    def observe(self, agent):
        """
        Return only raw observation, removing action mask.
        """
        return super().observe(agent)["observation"]

    def action_mask(self):
        """
        Separate function used in order to access the action mask.
        """
        return super().observe(self.agent_selection)["action_mask"]
