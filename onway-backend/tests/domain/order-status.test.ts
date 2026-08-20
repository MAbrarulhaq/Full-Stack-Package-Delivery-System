
 // Pure unit tests for the state machine -- no DB, no HTTP, no app import.
 // This is the "focused unit tests for pure domain logic" half of the
 // suite; everything else in tests/ is an HTTP-level integration test.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isValidTransition,
  getAllowedTransitions,
  isTerminalStatus,
  ORDER_STATUSES,
} from "../../src/domain/order-status";

describe("order-status domain", () => {
  describe("valid transitions", () => {
    const validCases: Array<[string, string]> = [
      ["pending", "picked_up"],
      ["picked_up", "in_transit"],
      ["in_transit", "out_for_delivery"],
      ["out_for_delivery", "delivered"],
      ["pending", "cancelled"],
      ["picked_up", "cancelled"],
      ["in_transit", "cancelled"],
      ["out_for_delivery", "cancelled"],
    ];

    for (const [from, to] of validCases) {
      it(`allows ${from} -> ${to}`, () => {
        assert.equal(isValidTransition(from as any, to as any), true);
      });
    }
  });

  describe("invalid transitions", () => {
    const invalidCases: Array<[string, string]> = [
      ["pending", "delivered"],
      ["pending", "in_transit"],
      ["pending", "out_for_delivery"],
      ["picked_up", "delivered"],
      ["picked_up", "pending"],
      ["delivered", "cancelled"],
      ["delivered", "pending"],
      ["cancelled", "pending"],
      ["cancelled", "picked_up"],
    ];

    for (const [from, to] of invalidCases) {
      it(`rejects ${from} -> ${to}`, () => {
        assert.equal(isValidTransition(from as any, to as any), false);
      });
    }
  });

  describe("terminal states", () => {
    it("delivered has no allowed transitions", () => {
      assert.deepEqual(getAllowedTransitions("delivered"), []);
      assert.equal(isTerminalStatus("delivered"), true);
    });

    it("cancelled has no allowed transitions", () => {
      assert.deepEqual(getAllowedTransitions("cancelled"), []);
      assert.equal(isTerminalStatus("cancelled"), true);
    });

    it("non-terminal statuses report isTerminalStatus === false", () => {
      for (const status of ["pending", "picked_up", "in_transit", "out_for_delivery"] as const) {
        assert.equal(isTerminalStatus(status), false);
      }
    });
  });

  it("ORDER_STATUSES contains exactly the six expected values", () => {
    assert.deepEqual(
      [...ORDER_STATUSES].sort(),
      ["cancelled", "delivered", "in_transit", "out_for_delivery", "picked_up", "pending"].sort(),
    );
  });
});
