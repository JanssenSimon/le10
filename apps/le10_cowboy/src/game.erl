-module(game).

-behaviour(gen_statem).

-export([]).

% first state: wait for seating
%   receive message of someone connecting -> add them, great
%       if 4 players, prompt to start game
%           if positive response -> go to next state
%   receive message of someone disconnecting doesnt matter keep waiting
%   receive request to be seated
%       if already seated, change seat
%       if to "spectating", no problem
%       if to player position:
%           is seat taken?
%               no -> take the seat
%               yes -> send back error
%
% second: betting
%   receive message of someone disconnecting : change state to waiting state
%   shuffle cards and send messages to players with their cards
%   if betting statem sends message with end of betting, move to next state
%   receive another message -> forward it to betting statem process
%
% third through twelfth: tricks
%   receive message of someone disconnecting : change state to waiting state
%   if trick statem sends message with end of trick, move to next trick or end of game
%   receive another message -> forward it to trick statem process
%
% last state: end of game (prompt for restart/quit game)
%   prompt for game restart
%       if receive confirmation -> go back to first state
%   receive message of someone disconnecting thats ok
%
% bonus state: waiting state
%   someone connected
%       if all players there? -> return to previous state
