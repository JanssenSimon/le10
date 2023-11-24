%%%-------------------------------------------------------------------
%% @doc le10_cowboy public API
%% @end
%%%-------------------------------------------------------------------

-module(le10_cowboy_app).

-behaviour(application).

-export([start/2, stop/1]).

start(_StartType, _StartArgs) ->
  Routes =
    [
      {
        '_',
        [
          {"/", cowboy_static, {priv_file, le10_cowboy, "www/index.html"}},
          {"/websocket", ws_handler, []},
          {"/[...]", cowboy_static, {priv_dir, le10_cowboy, "www"}}
        ]
      }
    ],
  Dispatch = cowboy_router:compile(Routes),
  {ok, _} = cowboy:start_clear(le10_listener, [{port, 8080}], #{env => #{dispatch => Dispatch}}),
  le10_cowboy_sup:start_link().


stop(_State) -> ok = cowboy:stop_listener(le10_listener).

%% internal functions
