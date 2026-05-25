import type { RoomData } from '../data/mockData';

/**
 * Calculates lighting fixtures needed based on Lumen Method.
 * Formula: N = (E * A) / (F * UF * MF)
 */
export function calculateLightingFixtures(room: RoomData): number {
  if (room.area <= 0 || room.fixtureLumens <= 0) return 0;
  const num = (room.luxTarget * room.area) / (room.fixtureLumens * room.uf * room.mf);
  return Math.ceil(num);
}

/**
 * Estimates required power socket count based on room type and custom devices.
 */
export function calculateSockets(room: RoomData): number {
  let count = 0;
  
  // Workstation sockets
  count += room.workstationsCount * 2;
  
  // Manager room default sockets
  if (room.type === 'Manager Room') {
    count += 4;
  }
  
  // Meeting rooms default sockets (Floor Box + Wall)
  if (room.type === 'Meeting Room') {
    count += room.area > 35 ? 12 : 8;
  }
  
  // Pantry sockets (switched socket spurs for microwave/fridge + counter sockets)
  if (room.type === 'Pantry') {
    count += 8;
  }
  
  // Server room sockets (racks + utilities)
  if (room.type === 'Server Room') {
    count += 10;
  }
  
  // General outlets for reception/corridors
  if (room.type === 'Reception') count += 6;
  if (room.type === 'Corridor') count += Math.ceil(room.area / 40) * 2;
  if (room.type === 'Prayer Room') count += 4;
  if (room.type === 'Storage') count += 2;
  if (room.type === 'Washroom') count += 2; // Shaver sockets or utilities
  
  return count;
}

/**
 * Calculates preliminary power load in kW for the room.
 */
export function calculateLoadKw(room: RoomData): number {
  let kw = 0;
  
  // Workstation load: 150W per workstation
  kw += (room.workstationsCount * 150) / 1000;
  
  // General socket loads: 200W per double outlet
  const sockets = calculateSockets(room);
  kw += (sockets * 100) / 1000;
  
  // Lighting load: ~10W per sqm of LED
  kw += (room.area * 10) / 1000;
  
  // Dedicated equipment load
  if (room.type === 'Server Room') {
    kw += 20; // Server Rack base load + cooling placeholder
  }
  
  if (room.type === 'Pantry' && room.hasPantryEquipment) {
    kw += 8.5; // Microwaves + espresso + fridge load
  }
  
  if (room.hasPrinter) {
    kw += 1.5;
  }
  
  return parseFloat(kw.toFixed(2));
}

/**
 * Generates low current point distributions.
 */
export function calculateElvPoints(room: RoomData) {
  // Data Outlets
  let data = 0;
  data += room.workstationsCount * 2;
  if (room.type === 'Manager Room') data += 4;
  if (room.type === 'Meeting Room') data += 8;
  if (room.type === 'Reception') data += 4;
  if (room.type === 'Server Room') data += 24; // Backbone + switches
  if (room.type === 'Pantry') data += 2;
  if (room.type === 'Prayer Room') data += 2;
  if (room.type === 'Storage') data += 1;
  
  // CCTV Dome Cameras
  let cctv = 0;
  if (room.type === 'Reception') cctv = 2;
  if (room.type === 'Server Room') cctv = 2;
  if (room.type === 'Open Office') cctv = Math.ceil(room.area / 120);
  if (room.type === 'Corridor') cctv = Math.ceil(room.area / 40);
  
  // Wi-Fi Access Points (Assuming 80 sqm coverage radius per AP in standard structures)
  let wifi = 0;
  if (room.type === 'Open Office') wifi = Math.ceil(room.area / 100);
  else if (room.type === 'Reception' || room.type === 'Meeting Room' || room.type === 'Prayer Room' || room.type === 'Corridor') {
    wifi = 1;
  }
  
  // Access Control Readers (Server room, Main entrances, manager, boardroom)
  let access = 0;
  if (room.type === 'Server Room') access = 1;
  if (room.type === 'Reception') access = 1; // Main entrance
  if (room.type === 'Manager Room') access = 1;
  if (room.type === 'Meeting Room' && room.area > 35) access = 1;
  if (room.type === 'Storage') access = 1;
  
  // BMS temperature sensors
  let bms = 0;
  if (room.type === 'Server Room') bms = 4; // Air temp + water leak
  else if (room.type === 'Open Office') bms = Math.ceil(room.area / 150);
  else if (room.type !== 'Storage' && room.type !== 'Washroom') {
    bms = 1; // Thermostat zone sensor
  }
  
  return {
    dataOutlets: data,
    cctv: cctv,
    wifi: wifi,
    accessControl: access,
    bmsSensors: bms
  };
}
