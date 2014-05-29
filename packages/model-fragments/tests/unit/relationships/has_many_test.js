var store, League, Team, Player, players, leagues;
var all = Ember.RSVP.all;

module("unit/relationships - DS.hasMany", {
  setup: function() {

    // Models
    League = DS.Model.extend({
      name: DS.attr('string'),
      teams: DS.hasManyFragments('team')
    });
    Team = DS.ModelFragment.extend({
      name: DS.attr('string'),
      players: DS.hasMany('player', {async:true})
    });
    Player = DS.Model.extend({
      name: DS.attr('string')
    });

    // Initialize Store
    env = setupStore({
      team: Team,
      player: Player,
      league: League
    });
    store = env.store;

    // Fixtures
    players = [
      {
        id: 1,
        name: "Bob"
      },
      {
        id: 2,
        name: "Joe"
      }
    ];

    leagues = [
      {
        id: 1,
        name: "AAA",
        teams: [
          {
            name: "A Team",
            players: [1,2]
          },
          {
            name: "B Team",
            players: [2]
          }
        ]
      },
      {
        id: 2,
        name: "BB",
        teams: [
          {
            name: "C Team",
            players: [1]
          }
        ]
      },
      {
        id: 3,
        teams: null
      }
    ];
  },

  teardown: function() {
    store = null;
    League = null;
    Team = null;
    Player = null;
    players = null;
    leagues = null;
  }
});

function pushLeague(id) {
  store.push(League, Ember.copy(Ember.A(leagues).findBy('id', id), true));
}

function pushPlayer(id) {
  store.push(Player, Ember.copy(Ember.A(players).findBy('id', id), true));
}


test("fragments pushed with hasMany relationship to a model", function() {
  pushPlayer(1);
  pushPlayer(2);
  pushLeague(1);

  store.find(League, 1).then(async(function(league) {
    var teams = league.get('teams');
    var length = teams.get('length');

    store.find(Player, 1).then(async(function(player) {
        ok(player instanceof Player, "player record is an instance of `Player`");

        var team1 = teams.objectAt(0);

        ok(team1 instanceof Team, "team1 record is an instance of `Team`");

        var ps = team1.get('players');
        console.log(ps);
        var p = ps.objectAt(0);
        console.log(p);
        ok(typeof p !== "number", "p record is not a number (id)");
        ok(p instanceof Player, "p record is an instance of `Player`");

        //equal(p.objectAt(0), player, "property of belongsTo is correct model record");

        //equal(purchases.get('length'), length + 1, "purchases property size is correct");
        //equal(purchases.indexOf(purchase), length, "new fragment is in correct location");

    }));
  }));
});


test("serializing creates a new Array with contents the result of serializing each fragment", function() {
  pushPlayer(1);
  pushPlayer(2);
  pushLeague(1);

  env.container.register('serializer:team', DS.JSONSerializer);

  // TODO: this is necessary to set `typeKey` and prevent `store#serializerFor` from blowing up
  store.modelFor('league');

  store.find(League, 1).then(async(function(league) {
    var serialized = league.serialize();
    console.log(serialized);

    var s = Ember.A(leagues).findBy('id', 1);
    delete s.id;

    deepEqual(serialized, s, "serializing returns array of each fragment serialized including belongsTo relationships");
  }));
});


test("serializing model with fragments and sub-model relationships", function() {
  pushPlayer(1);
  pushPlayer(2);

  env.container.register('serializer:team', DS.JSONSerializer);

  // TODO: this is necessary to set `typeKey` and prevent `store#serializerFor` from blowing up
  store.modelFor('league');

  all([
    store.find(Player, 1),
    store.find(Player, 2)
  ]).then(async(function(players) {
    console.log(players);
    var p1 = players[0];
    var p2 = players[1];

    var t1 = store.createFragment('team', {
      name: "A Team"
      //players: [p1,p2]
    });
    t1.set('players',[]);
    
    t1.get('players').pushObject(p1);

    var t2 = store.createFragment('team',
    {
      name: "B Team",
      players: [p2]
    });
    t2.get('players').pushObject(p2);

    var league = store.createRecord('league', {
      id: "1",
      name: "AAA",
      teams: [
        t1,
        t2
      ]
    });

    var serialized = league.serialize();
    console.log(serialized);

    var s = Ember.A(leagues).findBy('id', 1);
    delete s.id;

    deepEqual(serialized, s, "serializing returns array of each fragment serialized including belongsTo relationships");

  }));

});
