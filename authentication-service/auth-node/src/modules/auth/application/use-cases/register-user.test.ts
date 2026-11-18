import { describe, expect, it, vi } from 'vitest';
import { ConflictError } from '../../../../shared/domain/errors.ts';
import { aUser, fakeDeps, flushBackground } from '../../../../test/fakes.ts';
import { makeRegisterUser, type RegisterInput } from './register-user.ts';

const input = (overrides: Partial<RegisterInput> = {}): RegisterInput => ({
  name: 'Andrea',
  surname: 'Morales',
  username: 'andrea.morales',
  email: 'andrea.morales@kinalsports.gt',
  password: 'Admin1234!',
  phone: '42178935',
  profilePicture: null,
  ...overrides,
});

const setup = () => {
  const deps = fakeDeps();
  deps.users.create.mockResolvedValue(aUser({ status: false }));
  return { deps, register: makeRegisterUser(deps) };
};

describe('registerUser', () => {
  it('crea el usuario con la contraseña hasheada y el rol USER_ROLE', async () => {
    const { deps, register } = setup();

    const result = await register(input());

    expect(deps.passwords.hash).toHaveBeenCalledWith('Admin1234!');
    expect(deps.users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordHash: 'hash-nuevo',
        roleName: 'USER_ROLE',
        profilePicture: 'avatarDefault.png',
      })
    );
    expect(result).toMatchObject({
      success: true,
      emailVerificationRequired: true,
    });
    // El registro no inicia sesión
    expect(result).not.toHaveProperty('accessToken');
  });

  it('guarda un token de verificación de 24 horas y envía el correo', async () => {
    const { deps, register } = setup();

    await register(input());
    await flushBackground();

    const [, token, expiry] =
      deps.users.setEmailVerificationToken.mock.calls[0]!;
    expect(token).toHaveLength(43);
    const hours = ((expiry as Date).getTime() - Date.now()) / 36e5;
    expect(hours).toBeGreaterThan(23.9);
    expect(deps.emails.sendVerification).toHaveBeenCalledWith(
      'andrea.morales@kinalsports.gt',
      'Andrea',
      token
    );
  });

  it('un fallo al enviar el correo no rompe el registro', async () => {
    const { deps, register } = setup();
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    deps.emails.sendVerification.mockRejectedValue(new Error('smtp caído'));

    await expect(register(input())).resolves.toMatchObject({ success: true });
    await flushBackground();
    expect(logged).toHaveBeenCalled();
  });

  it('rechaza un email o username repetido (409)', async () => {
    const { deps, register } = setup();
    deps.users.existsByEmailOrUsername.mockResolvedValue(true);

    await expect(register(input())).rejects.toBeInstanceOf(ConflictError);
    expect(deps.users.create).not.toHaveBeenCalled();
  });

  it('sube a Cloudinary la foto subida como archivo local', async () => {
    const { deps, register } = setup();

    await register(input({ profilePicture: 'uploads/foto.png' }));

    expect(deps.images.upload).toHaveBeenCalledWith(
      'uploads/foto.png',
      expect.stringMatching(/^profile-[0-9a-f]{12}\.png$/)
    );
    expect(deps.users.create).toHaveBeenCalledWith(
      expect.objectContaining({ profilePicture: 'v1/profile-abc.png' })
    );
  });

  it('usa el avatar por defecto si la subida falla', async () => {
    const { deps, register } = setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    deps.images.upload.mockRejectedValue(new Error('cloudinary caído'));

    await register(input({ profilePicture: 'uploads/foto.png' }));

    expect(deps.users.create).toHaveBeenCalledWith(
      expect.objectContaining({ profilePicture: 'avatarDefault.png' })
    );
  });

  it('reduce una URL de Cloudinary al nombre del archivo', async () => {
    const { deps, register } = setup();

    await register(
      input({
        profilePicture:
          'https://res.cloudinary.com/demo/image/upload/auth_service/profiles/foto.png',
      })
    );

    expect(deps.users.create).toHaveBeenCalledWith(
      expect.objectContaining({ profilePicture: 'foto.png' })
    );
  });
});
