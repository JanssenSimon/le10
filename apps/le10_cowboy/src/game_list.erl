-module(game_list).

-behaviour(gen_server).

-export(
  [
    start_link/0,
    new_game/0,
    delete_game/1,
    get_list/0,
    subscribe/1,
    unsubscribe/1,
    init/1,
    handle_call/3,
    handle_cast/2
  ]
).

start_link() -> gen_server:start_link({local, game_list}, game_list, [], []).

new_game() -> gen_server:call(game_list, new_game).

delete_game(Game) -> gen_server:cast(game_list, {delete_game, Game}).

get_list() -> gen_server:call(game_list, get_list).

subscribe(Game) -> gen_server:call(game_list, {subscribe, Game}).

unsubscribe(Game) -> gen_server:call(game_list, {unsubscribe, Game}).

init(_Args) -> {ok, []}.

handle_call(new_game, _From, Games) -> {reply, ok, [{game, "Hello"} | Games]};
handle_call(get_list, _From, Games) -> {reply, Games, Games};
handle_call({subscribe, Game}, From, Games) -> {noreply, Games};
handle_call({unsubscribe, Game}, From, Games) -> {noreply, Games}.

handle_cast({delete_game, Game}, Games) -> {noreply, lists:delete(Game, Games)}.
