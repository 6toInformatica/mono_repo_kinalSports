import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./feedback";

describe("EmptyState", () => {
  it("muestra el título, el mensaje y la acción", () => {
    render(
      <EmptyState
        title="Sin canchas"
        message="Todavía no hay canchas registradas."
        action={<button type="button">Crear cancha</button>}
      />,
    );

    expect(screen.getByText("Sin canchas")).toBeInTheDocument();
    expect(
      screen.getByText("Todavía no hay canchas registradas."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Crear cancha" }),
    ).toBeInTheDocument();
  });
});
