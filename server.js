require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const pool = require("./db");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Health check
app.get("/health", async (req, res) => {
  try {
    const r = await pool.query("SELECT NOW() as now");
    res.json({ ok: true, now: r.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "DB ulanmagan" });
  }
});

// SIGNUP
app.post("/signup", async (req, res) => {
  try {
    const { username, password, profileType } = req.body;

    if (!profileType)
      return res.json({ status: "error", message: "Profil turi tanlanmagan!" });

    const hashPass = bcrypt.hashSync(password, 10);

    await pool.query(
      "INSERT INTO users (username, password, profiletype) VALUES ($1,$2,$3)",
      [username, hashPass, profileType]
    );

    res.json({ status: "ok", message: "Ro'yxatdan o'tish muvaffaqiyatli!" });
  } catch (err) {
    console.error(err);
    res.json({ status: "error", message: "Bu foydalanuvchi nomi band!" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE username=$1", [
      username,
    ]);

    if (result.rows.length === 0)
      return res.json({ status: "error", message: "Foydalanuvchi topilmadi!" });

    const user = result.rows[0];

    if (!bcrypt.compareSync(password, user.password))
      return res.json({ status: "error", message: "Parol noto'g'ri!" });

    res.json({
      status: "ok",
      message: "Kirish muvaffaqiyatli!",
      username: user.username,
      profileType: user.profiletype,
    });
  } catch (err) {
    console.error(err);
    res.json({ status: "error", message: "Server xatoligi" });
  }
});

// getDriverInfo
app.get("/getDriverInfo", async (req, res) => {
  try {
    const { username } = req.query;

    const result = await pool.query(
      "SELECT * FROM drivers WHERE username=$1",
      [username]
    );

    if (result.rows.length === 0)
      return res.json({ status: "ok", karta: null, transport: null });

    res.json({
      status: "ok",
      karta: result.rows[0].karta,
      transport: result.rows[0].transport,
    });
  } catch (err) {
    console.error(err);
    res.json({ status: "error" });
  }
});

// getProfile
app.post("/getProfile", async (req, res) => {
  try {
    const { username } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE username=$1", [
      username,
    ]);

    if (result.rows.length === 0) return res.json({ status: "error" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.json({ status: "error" });
  }
});

// order
app.post("/order", async (req, res) => {
  try {
    const { name, phone, from_city, to_city, cargo } = req.body;

    if (!name || !phone || !from_city || !to_city) {
      return res.json({
        status: "error",
        message: "Iltimos, barcha maydonlarni to‘ldiring",
      });
    }

    await pool.query(
      "INSERT INTO orders (name, phone, from_city, to_city, cargo) VALUES ($1,$2,$3,$4,$5)",
      [name, phone, from_city, to_city, cargo || ""]
    );

    res.json({
      status: "ok",
      message: "Buyurtma qabul qilindi! Tez orada bog‘lanamiz.",
    });
  } catch (err) {
    console.error(err);
    res.json({ status: "error", message: "Buyurtmani saqlashda xatolik" });
  }
});

app.listen(process.env.PORT || 4000, () => {
  console.log("Server portda ishga tushdi:", process.env.PORT || 4000);
});
