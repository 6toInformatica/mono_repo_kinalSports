import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/shared/api/client";
import { LoginForm } from "./LoginForm";
import { ResetPassword } from "./ResetPassword";
import { login } from "./session";

const router = { replace: vi.fn(), refresh: vi.fn() };
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => searchParams,
}));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));
vi.mock("./session", () => ({ login: vi.fn() }));
vi.mock("@/shared/api/client", () => ({ api: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  searchParams = new URLSearchParams();
});

describe("LoginForm", () => {
  it("inicia sesión y entra al dashboard", async () => {
    vi.mocked(login).mockResolvedValue({ user: {} as never });
    render(<LoginForm />);

    await userEvent.type(
      screen.getByLabelText(/Correo o usuario/),
      "roberto.juarez",
    );
    await userEvent.type(screen.getByLabelText(/Contraseña/), "Admin1234!");
    await userEvent.click(
      screen.getByRole("button", { name: "Iniciar sesión" }),
    );

    expect(login).toHaveBeenCalledWith("roberto.juarez", "Admin1234!");
    expect(router.replace).toHaveBeenCalledWith("/dashboard");
  });

  it("muestra el error del backend", async () => {
    vi.mocked(login).mockRejectedValue(new Error("Credenciales inválidas"));
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/Correo o usuario/), "x");
    await userEvent.type(screen.getByLabelText(/Contraseña/), "y");
    await userEvent.click(
      screen.getByRole("button", { name: "Iniciar sesión" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Credenciales inválidas",
    );
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("avisa cuando la sesión expiró", () => {
    searchParams = new URLSearchParams("expired=1");
    render(<LoginForm />);

    expect(screen.getByRole("alert")).toHaveTextContent("Tu sesión expiró");
  });

  it("permite pedir el enlace de recuperación", async () => {
    vi.mocked(api).mockResolvedValue({});
    render(<LoginForm />);

    await userEvent.click(screen.getByRole("button", { name: /Olvidaste/ }));
    await userEvent.type(
      screen.getByLabelText(/Correo/),
      "roberto.juarez@kinalsports.gt",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Enviar enlace" }),
    );

    expect(api).toHaveBeenCalledWith("auth", "auth/forgot-password", {
      method: "POST",
      body: { email: "roberto.juarez@kinalsports.gt" },
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "te enviamos un enlace",
    );
  });
});

describe("ResetPassword", () => {
  const fill = async (password: string, confirm: string) => {
    await userEvent.type(screen.getByLabelText("Nueva contraseña"), password);
    await userEvent.type(
      screen.getByLabelText("Confirmar contraseña"),
      confirm,
    );
    await userEvent.click(screen.getByRole("button"));
  };

  it("no envía nada si las contraseñas no coinciden", async () => {
    searchParams = new URLSearchParams("token=abc");
    render(<ResetPassword />);

    await fill("Nueva12345!", "Otra12345!");

    expect(
      screen.getByText("Las contraseñas no coinciden."),
    ).toBeInTheDocument();
    expect(api).not.toHaveBeenCalled();
  });

  it("envía el token del enlace y muestra el mensaje de éxito", async () => {
    searchParams = new URLSearchParams("token=abc");
    vi.mocked(api).mockResolvedValue({
      message: "Contraseña actualizada exitosamente",
    });
    render(<ResetPassword />);

    await fill("Nueva12345!", "Nueva12345!");

    expect(api).toHaveBeenCalledWith("auth", "auth/reset-password", {
      method: "POST",
      body: { token: "abc", newPassword: "Nueva12345!" },
    });
    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: /inicio de sesión/ }),
      ).toBeInTheDocument(),
    );
  });

  it("deshabilita el envío si el enlace no trae token", () => {
    render(<ResetPassword />);

    expect(screen.getByRole("button")).toBeDisabled();
  });
});
