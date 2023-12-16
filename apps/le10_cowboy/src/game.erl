-module(game).

-behaviour(gen_statem).

-export([]).

% first state: wait for seating
% second: betting
% third through twelfth: tricks
% last state: end of game (prompt for restart/quit game)
