import Map "mo:core/Map";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Iter "mo:core/Iter";

actor {
  type Preset = {
    name : Text;
    engineLevel1 : Nat;
    engineLevel2 : Nat;
    engineLevel3 : Nat;
    engineLevel4 : Nat;
    equalizerBands : [Int];
    volumeBooster : Nat;
    bassBooster : Nat;
    virtualSimulation : Bool;
    loudMode : Bool;
  };

  module Preset {
    public func compare(preset1 : Preset, preset2 : Preset) : Order.Order {
      Text.compare(preset1.name, preset2.name);
    };
  };

  let presets = Map.empty<Text, Preset>();
  var activePresetId : ?Text = null;

  public shared ({ caller }) func createPreset(
    id : Text,
    name : Text,
    engineLevel1 : Nat,
    engineLevel2 : Nat,
    engineLevel3 : Nat,
    engineLevel4 : Nat,
    equalizerBands : [Int],
    volumeBooster : Nat,
    bassBooster : Nat,
    virtualSimulation : Bool,
    loudMode : Bool,
  ) : async () {
    if (presets.containsKey(id)) { Runtime.trap("Preset with this ID already exists") };

    if (engineLevel1 > 100 or engineLevel2 > 100 or engineLevel3 > 100 or engineLevel4 > 100) {
      Runtime.trap("Engine levels must be between 0 and 100");
    };
    validateEqualizerBands(equalizerBands);
    if (volumeBooster > 1700) { Runtime.trap("Volume booster must be between 0 and 1700") };
    if (bassBooster > 100) { Runtime.trap("Bass booster must be between 0 and 100") };

    let preset : Preset = {
      name;
      engineLevel1;
      engineLevel2;
      engineLevel3;
      engineLevel4;
      equalizerBands;
      volumeBooster;
      bassBooster;
      virtualSimulation;
      loudMode;
    };

    presets.add(id, preset);
  };

  func validateEqualizerBands(bands : [Int]) {
    if (bands.size() != 10) {
      Runtime.trap("Equalizer bands must have exactly 10 elements");
    };
    let iter = Int.range(0, bands.size().toInt());
    iter.forEach(
      func(i) {
        if (bands[i.toNat()] < -100 or bands[i.toNat()] > 100) {
          Runtime.trap("Band values must be between -100 and 100");
        };
      }
    );
  };

  public query ({ caller }) func readPreset(id : Text) : async Preset {
    switch (presets.get(id)) {
      case (null) { Runtime.trap("Preset not found") };
      case (?preset) { preset };
    };
  };

  public shared ({ caller }) func updatePreset(
    id : Text,
    name : Text,
    engineLevel1 : Nat,
    engineLevel2 : Nat,
    engineLevel3 : Nat,
    engineLevel4 : Nat,
    equalizerBands : [Int],
    volumeBooster : Nat,
    bassBooster : Nat,
    virtualSimulation : Bool,
    loudMode : Bool,
  ) : async () {
    switch (presets.get(id)) {
      case (null) { Runtime.trap("Preset not found") };
      case (?_) {
        if (engineLevel1 > 100 or engineLevel2 > 100 or engineLevel3 > 100 or engineLevel4 > 100) {
          Runtime.trap("Engine levels must be between 0 and 100");
        };
        validateEqualizerBands(equalizerBands);
        if (volumeBooster > 1700) { Runtime.trap("Volume booster must be between 0 and 1700") };
        if (bassBooster > 100) { Runtime.trap("Bass booster must be between 0 and 100") };

        let preset : Preset = {
          name;
          engineLevel1;
          engineLevel2;
          engineLevel3;
          engineLevel4;
          equalizerBands;
          volumeBooster;
          bassBooster;
          virtualSimulation;
          loudMode;
        };

        presets.add(id, preset);
      };
    };
  };

  public shared ({ caller }) func deletePreset(id : Text) : async () {
    if (not presets.containsKey(id)) {
      Runtime.trap("Preset not found");
    };
    presets.remove(id);
  };

  public query ({ caller }) func getAllPresets() : async [Preset] {
    presets.values().toArray().sort(); // uses implicit Preset.compare
  };

  public shared ({ caller }) func setActivePreset(id : Text) : async () {
    switch (presets.get(id)) {
      case (null) { Runtime.trap("Preset not found") };
      case (?_) { activePresetId := ?id };
    };
  };

  public query ({ caller }) func getActivePreset() : async ?Preset {
    switch (activePresetId) {
      case (null) { null };
      case (?id) { presets.get(id) };
    };
  };
};
