import { transformSync } from "@babel/core";
import plugin from "../../../babel/app-font-components.cjs";

const source = `
import { View, Text, TextInput as Field } from "react-native";
export const Screen = () => null;
`;

describe("app-font-components", () => {
  it("redirige Text y TextInput sin reasignar react-native", () => {
    const result = transformSync(source, {
      filename: "/app/src/features/example/Screen.jsx",
      babelrc: false,
      configFile: false,
      plugins: [plugin],
    });
    const code = result.code;
    expect(code).toContain("AppText.jsx");
    expect(code).toContain("View");
    expect(code).toContain('from "react-native"');
    expect(code).not.toMatch(/\.Text\s*=/);
    expect(code).toMatch(/Text/);
    expect(code).toMatch(/Field/);
  });

  it("no reescribe el propio componente de texto", () => {
    const result = transformSync(
      'import { Text as RNText } from "react-native";\nexport const Original = RNText;',
      {
        filename: "/app/src/shared/ui/AppText.jsx",
        babelrc: false,
        configFile: false,
        plugins: [plugin],
      },
    );
    expect(result.code).toContain("react-native");
  });
});
