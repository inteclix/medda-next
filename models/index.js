const bcrypt = require("bcryptjs");
const config = require("../config/db.config.js");
const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
const { Sequelize } = require("sequelize");

/* mysql2
const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  port: config.PORT,
  dialect: config.dialect,
  operatorsAliases: 0,

  pool: {
    max: config.pool.max,
    min: config.pool.min,
    acquire: config.pool.acquire,
    idle: config.pool.idle,
  },
});
*/
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});

/*
  loading models from files
 */

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.clinic = require("./clinic")(sequelize, Sequelize)
db.user = require("./user")(sequelize, Sequelize)
db.doctor = require("./doctor")(sequelize, Sequelize)
db.patient = require("./patient")(sequelize, Sequelize)
db.speciality = require("./speciality")(sequelize, Sequelize)
db.analyse = require("./analyse")(sequelize, Sequelize)
db.appointment = require("./appointment")(sequelize, Sequelize)
db.consultation = require("./consultation")(sequelize, Sequelize)
db.consultationHealthParameter = require("./consultationHealthParameter")(sequelize, Sequelize)
db.healthParameter = require("./healthParameter")(sequelize, Sequelize)
db.healthParameterCategory = require("./healthParameterCategory")(sequelize, Sequelize)
db.healthParameterOption = require("./healthParameterOption")(sequelize, Sequelize)
db.medicament = require("./medicament")(sequelize, Sequelize)
db.medicamentPrescription = require("./medicamentPrescription")(sequelize, Sequelize)
db.prescription = require("./prescription")(sequelize, Sequelize)
db.secretary = require("./secretary")(sequelize, Sequelize)

/*
  setup relation between models
 */

// users
db.user.doctor = db.user.hasOne(db.doctor);
db.user.secretary = db.user.hasOne(db.secretary);
db.user.patient = db.user.hasOne(db.patient);

// clinics
db.clinic.secretaries = db.clinic.hasMany(db.secretary);
//db.clinic.patients = db.clinic.hasMany(db.patient);
db.clinic.doctors = db.clinic.hasMany(db.doctor);
db.clinic.appointments = db.clinic.hasMany(db.appointment);
db.clinic.belongsToMany(db.patient, { through: "clinic_patient" })

// doctors
db.doctor.user = db.doctor.belongsTo(db.user);
db.doctor.speciality = db.doctor.belongsTo(db.speciality);
db.doctor.clinic = db.doctor.belongsTo(db.clinic);
db.doctor.appointments = db.doctor.hasMany(db.appointment);

// specialities
db.speciality.doctors = db.speciality.hasMany(db.doctor);

// secretaries
db.secretary.user = db.secretary.belongsTo(db.user);

// patients
db.patient.belongsTo(db.user);
db.patient.belongsTo(db.user, {
  as: "createdBy",
  foreignKey: "createdById",
});
db.patient.belongsTo(db.doctor, {
  as: "addressedBy",
  foreignKey: "addressedById",
});
db.patient.appointments = db.patient.hasMany(db.appointment);
db.patient.consultations = db.patient.hasMany(db.consultation);
db.patient.belongsToMany(db.clinic, { through: "clinic_patient" })
// appointments
db.appointment.belongsTo(db.patient)
db.appointment.belongsTo(db.clinic)
db.appointment.belongsTo(db.doctor)
db.appointment.belongsTo(db.user, {
  as: "createdBy",
  foreignKey: "createdById",
});
db.appointment.belongsTo(db.user, {
  as: "editedBy",
  foreignKey: "editedById",
});

// consultation
db.consultation.belongsTo(db.patient)
db.consultation.belongsTo(db.doctor)
db.consultation.belongsToMany(db.healthParameter, { through: "consultation_health_parameters" })
db.consultation.belongsToMany(db.analyse, { through: "analyse_consultation" })

// health parameter
db.healthParameter.belongsToMany(db.consultation, {through: "consultation_health_parameters"})
db.healthParameter.hasMany(db.healthParameterOption)
db.healthParameterOption.belongsTo(db.healthParameter)
db.healthParameter.belongsTo(db.healthParameterCategory)
db.healthParameterCategory.hasMany(db.healthParameter)

// prescription and medicament
db.prescription.belongsTo(db.consultation)
db.prescription.belongsToMany(db.medicament, { through: "medicament_prescription" })
db.medicament.belongsToMany(db.prescription, { through: "medicament_prescription" })

/*
  sync and seed
 */

//db.sequelize.sync({ force: true }).then(() => {seed();});

async function seed() {
  await db.speciality.create({
    id: 1,
    name: "generale",
  });

  await db.user.create({
    id: 1,
    is: "doctor",
    permissions: "['clinic', 'doctor']",
    username: "doctor",
    password: bcrypt.hashSync("123456", 8),
    mobile: "0500000000",
    isActive: 1
  });


  // clinic
  const clinic = await db.clinic.create({
    id: 1,
    name: "clinic saada",
  });


  await db.doctor.create({
    id: 1,
    userId: 1,
    clinicId: 1,
    specialityId: 1,
    isAdmin: 1,
  });

  // type: Sequelize.INTEGER // 0: text, 1: number, 2: date, 3: boolean, 4: list
  await db.healthParameterCategory.create({
    id: 1,
    name: "category name"
  })

  await db.healthParameter.create({
    id: 1,
    code: "code text",
    label: "name text",
    type: 0,
    healthParameterCategoryId: 1
  })

  await db.healthParameter.create({
    id: 2,
    code: "code number",
    label: "name number",
    type: 1,
    healthParameterCategoryId: 1
  })

  await db.healthParameter.create({
    id: 3,
    code: "code date",
    label: "name date",
    type: 2,
    healthParameterCategoryId: 1
  })
  await db.healthParameter.create({
    id: 4,
    code: "code boolean",
    label: "name boolean",
    type: 3,
    healthParameterCategoryId: 1
  })

  await db.healthParameter.create({
    id: 5,
    code: "code list",
    label: "name list",
    type: 4,
    healthParameterCategoryId: 1
  })

  await db.healthParameterOption.create({
    name: "option for list",
    healthParameterId: 5
  })

  await db.medicament.create({
    name: "doliprane"
  })
}

module.exports = db;
