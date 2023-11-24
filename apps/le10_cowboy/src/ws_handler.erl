-module(ws_handler).

-behaviour(cowboy_handler).

-export([init/2, websocket_init/1, websocket_handle/2, websocket_info/2]).

init(Req, State) -> {cowboy_websocket, Req, State}.

websocket_init(State) -> {[{text, "Initial matchmaking state"}], State}.

websocket_handle(Frame = {text, _}, State) -> {[Frame], State};
websocket_handle(_Frame, State) -> {ok, State}.

websocket_info(_Info, State) -> {ok, State}.
