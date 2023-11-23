%%%-------------------------------------------------------------------
%% @doc le10_cowboy public API
%% @end
%%%-------------------------------------------------------------------

-module(le10_cowboy_app).

-behaviour(application).

-export([start/2, stop/1]).

start(_StartType, _StartArgs) ->
  Routes = [{'_', [{<<"/">>, root_handler, []}]}],
  Dispatch = cowboy_router:compile(Routes),
  {ok, _} = cowboy:start_clear(le10_listener, [{port, 8080}], #{env => #{dispatch => Dispatch}}),
  le10_cowboy_sup:start_link().


stop(_State) ->
    ok = cowboy:stop_listener(le10_listener).

%% internal functions
