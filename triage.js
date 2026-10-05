const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "fleet_status.json");

function loadFleetStatus() {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read or parse fleet_status.json:", error.message);
    process.exit(1);
  }
}

function getFuelLevelPercentage(fuelLevel) {
  const value = Number.parseInt(fuelLevel.replace("%", ""), 10);

  if (Number.isNaN(value)) {
    throw new Error(`Invalid fuel level: ${fuelLevel}`);
  }

  return value;
}

function getUrgencyTags(vehicle) {
  const tags = [];
  const fuelLevel = getFuelLevelPercentage(vehicle.fuel_level);

  if (vehicle.overdue_hours > 0) {
    tags.push("🚨 OVERDUE");
  }

  if (vehicle.status === "rented" && fuelLevel < 20) {
    tags.push("⚠️ LOW FUEL");
  }

  return tags;
}

function getVehiclesRequiringAttention(fleet) {
  return fleet.filter((vehicle) => {
    const fuelLevel = getFuelLevelPercentage(vehicle.fuel_level);

    return (
      vehicle.overdue_hours > 0 ||
      (vehicle.status === "rented" && fuelLevel < 20)
    );
  });
}

function formatAlert(vehicles) {
  if (vehicles.length === 0) {
    return "✅ Fleet Operational Alert\n\nNo vehicles require immediate attention.";
  }

  const alertLines = vehicles.map((vehicle, index) => {
    const tags = getUrgencyTags(vehicle).join(" | ");

    return [
      `${index + 1}. Plate: ${vehicle.plate}`,
      `Model: ${vehicle.model}`,
      `Status: ${vehicle.status}`,
      `Urgency: ${tags}`,
    ].join("\n");
  });

  return ["🚘 Fleet Operational Alert", ...alertLines].join("\n\n");
}

function main() {
  try {
    const fleet = loadFleetStatus();

    const vehiclesRequiringAttention = getVehiclesRequiringAttention(fleet);

    const alertMessage = formatAlert(vehiclesRequiringAttention);

    console.log(alertMessage);
  } catch (error) {
    console.error("Fleet triage failed:", error.message);
    process.exit(1);
  }
}

main();
