import React from "react";
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
} from "react-native";
import { pickFontFamily } from "../constants/fonts.js";

const withAppFont = (Component) => {
  const Wrapped = React.forwardRef(function AppFontComponent(props, ref) {
    const flat = { ...(StyleSheet.flatten(props.style) || {}) };
    const fontFamily = pickFontFamily(flat);
    delete flat.fontWeight;
    delete flat.fontFamily;
    return <Component {...props} ref={ref} style={[flat, { fontFamily }]} />;
  });
  return Wrapped;
};

export const Text = withAppFont(RNText);
export const TextInput = withAppFont(RNTextInput);
