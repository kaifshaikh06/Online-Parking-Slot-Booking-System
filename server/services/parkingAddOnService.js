const parkingAddOns = Object.freeze([
  {
    code: "CAR_WASH",
    name: "Express Car Wash",
    description: "Exterior wash and quick dry.",
    price: 150,
  },
  {
    code: "INTERIOR_CLEANING",
    name: "Interior Cleaning",
    description: "Vacuum, dashboard, and floor-mat cleaning.",
    price: 250,
  },
  {
    code: "EXTERIOR_POLISH",
    name: "Exterior Polish",
    description: "Quick body polish for a fresh shine.",
    price: 400,
  },
  {
    code: "TYRE_SHINE",
    name: "Tyre Shine",
    description: "Tyre cleaning and shine treatment.",
    price: 100,
  },
  {
    code: "WINDSHIELD_CARE",
    name: "Windshield Care",
    description: "Glass cleaning and water-repellent treatment.",
    price: 120,
  },
  {
    code: "AC_SANITISATION",
    name: "AC Sanitisation",
    description: "Cabin and air-conditioner sanitisation.",
    price: 300,
  },
]);

const getSelectedAddOns = (addOnCodes = []) => {
  if (!Array.isArray(addOnCodes)) {
    const error = new Error("Selected services must be sent as a list.");
    error.statusCode = 400;
    throw error;
  }

  const uniqueCodes = [...new Set(addOnCodes.map((code) => String(code)))];
  if (uniqueCodes.length > 6) {
    const error = new Error("You can select up to six quick services.");
    error.statusCode = 400;
    throw error;
  }

  const selectedAddOns = uniqueCodes.map((code) =>
    parkingAddOns.find((addOn) => addOn.code === code),
  );
  if (selectedAddOns.some((addOn) => !addOn)) {
    const error = new Error("One or more selected services are not available.");
    error.statusCode = 400;
    throw error;
  }

  return selectedAddOns.map(({ code, name, price }) => ({ code, name, price }));
};

module.exports = { parkingAddOns, getSelectedAddOns };
