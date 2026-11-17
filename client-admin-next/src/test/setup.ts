// Matchers de DOM (toBeInTheDocument, toHaveTextContent...) y limpieza entre pruebas
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());
