import { describe, expect, it } from "vitest";
import { parseCommandVariables, resolveCommandVariables } from "./VariablePromptDialog";

describe("quick command variables", () => {
  it("parses multiple placeholders in one command", () => {
    const variables = parseCommandVariables("scp {{src}} {{dst}}");

    expect(variables.map(({ key, name, raw, raws }) => ({ key, name, raw, raws }))).toEqual([
      { key: "variable-0", name: "src", raw: "{{src}}", raws: ["{{src}}"] },
      { key: "variable-1", name: "dst", raw: "{{dst}}", raws: ["{{dst}}"] },
    ]);
  });

  it("deduplicates repeated variables by name", () => {
    const variables = parseCommandVariables("echo {{name}} {{name}}");

    expect(variables).toHaveLength(1);
    expect(variables[0]).toMatchObject({
      key: "variable-0",
      name: "name",
      raw: "{{name}}",
      raws: ["{{name}}"],
    });
  });

  it("parses default values", () => {
    const variables = parseCommandVariables("ssh {{host=127.0.0.1}}");

    expect(variables[0]).toMatchObject({
      key: "variable-0",
      name: "host",
      defaultValue: "127.0.0.1",
      raws: ["{{host=127.0.0.1}}"],
    });
  });

  it("parses options", () => {
    const variables = parseCommandVariables("docker {{action|start,stop,restart}} nginx");

    expect(variables[0]).toMatchObject({
      key: "variable-0",
      name: "action",
      options: ["start", "stop", "restart"],
      raws: ["{{action|start,stop,restart}}"],
    });
  });

  it("parses mixed variable styles", () => {
    const variables = parseCommandVariables("ssh {{user}}@{{host}} -p {{port=22}}");

    expect(variables.map(({ key, defaultValue }) => ({ key, defaultValue }))).toEqual([
      { key: "variable-0", defaultValue: undefined },
      { key: "variable-1", defaultValue: undefined },
      { key: "variable-2", defaultValue: "22" },
    ]);
  });

  it("resolves all placeholders for multiple and repeated variables", () => {
    const command = "ssh {{user}}@{{host=127.0.0.1}} && ping {{host}}";
    const variables = parseCommandVariables(command);

    expect(
      resolveCommandVariables(command, variables, {
        "variable-0": "root",
        "variable-1": "server.local",
      }),
    ).toBe("ssh root@server.local && ping server.local");
  });

  it("skips escaped placeholders as literals (docker --format)", () => {
    const variables = parseCommandVariables("docker ps --format '\\{{.Names}}'");

    expect(variables).toHaveLength(0);
  });

  it("parses real variables while keeping escaped literals intact", () => {
    const command = "echo {{msg}} && docker ps --format '\\{{.Names}}'";
    const variables = parseCommandVariables(command);

    expect(variables.map(({ name }) => name)).toEqual(["msg"]);
    expect(
      resolveCommandVariables(command, variables, { "variable-0": "hello" }),
    ).toBe("echo hello && docker ps --format '{{.Names}}'");
  });

  it("restores escaped braces back to literal double braces", () => {
    const command = "docker ps --format '\\{{.Names}}'";

    expect(resolveCommandVariables(command, [], {})).toBe(
      "docker ps --format '{{.Names}}'",
    );
  });
});
