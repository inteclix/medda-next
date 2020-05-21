import db from "../../../models"

export default async (req, res) => {
  const specialities = await db.speciality.findAll().catch(() => {
    return res.status(400).send({ message });
  });
  return res.status(200).send(specialities);
}