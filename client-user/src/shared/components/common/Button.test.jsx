import { fireEvent, render, screen } from "@testing-library/react-native";
import Button from "./Button";

// En Testing Library 14 render y los eventos son asíncronos
describe("Button", () => {
  it("llama a onPress al tocarlo", async () => {
    const onPress = jest.fn();
    await render(<Button title="Reservar" onPress={onPress} />);

    await fireEvent.press(screen.getByText("Reservar"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("no muestra el texto mientras está cargando", async () => {
    await render(<Button title="Reservar" onPress={jest.fn()} loading />);

    expect(screen.queryByText("Reservar")).toBeNull();
  });
});
