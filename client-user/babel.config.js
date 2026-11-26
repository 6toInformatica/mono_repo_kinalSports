export default function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["./babel/app-font-components.cjs"],
  };
}
