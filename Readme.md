# Corrupted Learning
A simulation and visualization based on Redish's computational model of
addiction (2004).

## How to use

There are two pages. index.html is a single simulation and two.html
is a two simultaneous simulations.

### Placing rewards

You can select between three placement modes: non-addictive, addictive, and agent.
Clicking a state in non-addictive mode will clear any existing rewards in the state and
place a non-addictive reward. If the state already contains a non-addictive reward,
it will be removed instead. Addictive rewards function similarly. In agent placement mode,
the agent will be moved to any state you click. Moving the agent does not modify value estimates.

### Simulation control

You can `step` through each time unit of the simulation, or `play` them continuously.
If `fast` is selected, the simulation will only be drawn when the agent reaches it's
final state before being randomly re-placed, allowing faster simulation.
You can `reset` the state value estimates without changing the reward placement or
`clear` all rewards and state values.

## References
Redish, A. D. (2004). Addiction as a Computational Process Gone Awry.
*Science* 306.
