import React from "react";
import { StyleSheet, Text, TextInput } from "react-native";
import { pickFontFamily } from "../constants/fonts.js";

const withAppFont = (Component, name) => {
  const Wrapped = React.forwardRef(function AppText(props, ref) {
    const flat = { ...(StyleSheet.flatten(props.style) || {}) };
    const fontFamily = pickFontFamily(flat);
    delete flat.fontWeight;
    delete flat.fontFamily;
    return <Component {...props} ref={ref} style={[flat, { fontFamily }]} />;
  });
  Wrapped.displayName = name;
  return Wrapped;
};

const reactNative = require("react-native");
reactNative.Text = withAppFont(Text, "Text");
reactNative.TextInput = withAppFont(TextInput, "TextInput");
