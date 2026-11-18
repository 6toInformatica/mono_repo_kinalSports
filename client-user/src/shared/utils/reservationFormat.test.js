import {
  formatDateValue,
  formatTimeValue,
  mapReservation,
  parseDateValue,
  parseTimeValue,
} from "./reservationFormat";

describe("mapReservation", () => {
  const reservation = {
    _id: "r1",
    status: "confirmed",
    startTime: "2027-01-10T16:00:00.000Z",
    endTime: "2027-01-10T18:00:00.000Z",
    fieldId: {
      _id: "f1",
      fieldName: "Cancha Sintética Norte",
      pricePerHour: 275,
      photo: "https://cdn.test/norte.png",
    },
  };

  it("arma la cancha, el total por horas y el estado normalizado", () => {
    expect(mapReservation(reservation)).toMatchObject({
      field: {
        id: "f1",
        name: "Cancha Sintética Norte",
        image: "https://cdn.test/norte.png",
        pricePerHour: 275,
      },
      totalPrice: 550, // 2 horas × Q275
      normalizedStatus: "CONFIRMED",
    });
  });

  it("tolera una cancha sin poblar y sin precio", () => {
    const mapped = mapReservation({ ...reservation, fieldId: "f1" });

    expect(mapped.field).toEqual({
      id: "f1",
      name: "Cancha",
      image: null,
      pricePerHour: null,
    });
    expect(mapped.totalPrice).toBeNull();
  });
});

describe("valores de fecha y hora del formulario", () => {
  it("convierte entre Date y texto en hora local", () => {
    const date = new Date(2027, 0, 5, 9, 7);

    expect(formatDateValue(date)).toBe("2027-01-05");
    expect(formatTimeValue(date)).toBe("09:07");
    expect(formatDateValue(parseDateValue("2027-01-05"))).toBe("2027-01-05");
    expect(formatTimeValue(parseTimeValue("18:30"))).toBe("18:30");
  });

  it("usa las 08:00 si no hay hora", () => {
    expect(formatTimeValue(parseTimeValue(""))).toBe("08:00");
  });
});
