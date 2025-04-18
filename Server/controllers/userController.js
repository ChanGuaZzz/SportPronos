import User from "../models/User.js";

const registerUser = async (req, res) => {
  const { username, email, phone, password } = req.body;
  if (!username || !password || !email || !phone) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  try {
    const existingUser = await User.findOne({
      $or: [{ username: username }, { email: email }, { phone: phone }],
    });

    if (existingUser) {
      let message = "El usuario ya existe";
      if (existingUser.username === username) {
        message = "El nombre de usuario ya está en uso";
      } else if (existingUser.email === email) {
        message = "El correo electrónico ya está registrado";
      } else if (existingUser.phone === phone) {
        message = "El número de teléfono ya está registrado";
      }
      return res.status(400).json({ message });
    }

    const newUser = new User({
      username,
      email,
      phone,
      password,
    });
    await newUser.save();
    req.session.user = newUser; // Guardar el usuario en la sesión
    return res.status(201).json({ message: "Usuario registrado correctamente", user: newUser });
  } catch (error) {
    return res.status(500).json({ message: "Error al comprobar el usuario" });
  }
};
const loginUser = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }
    req.session.user = user; // Guardar el usuario en la sesión
    console.log(req.session.user);
    return res.status(200).json({ message: "Inicio de sesión exitoso", user });
  } catch (error) {
    return res.status(500).json({ message: "Error al comprobar el usuario" });
  }
};
const updateProfile = async (req, res) => {
  const { username, email, phone } = req.body;
  const userId = req.session.user?._id; // Obtener el ID del usuario de la sesión
  if (!userId) {
    return res.status(401).json({ message: "No estás autenticado" });
  }
  try {
    const updatedUser = await User.findByIdAndUpdate(userId, { username, email, phone }, { new: true });
    req.session.user = updatedUser; // Actualizar el usuario en la sesión
    return res.status(200).json({ message: "Datos actualizados correctamente", user: updatedUser });
  } catch (error) {
    return res.status(500).json({ message: "Error al actualizar los datos" });
  }
};
const logoutUser = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error al cerrar sesión" });
    }
    res.clearCookie("connect.sid"); // Limpiar la cookie de sesión
    res.json({ message: "Sesión cerrada correctamente" });
  });
};

const createAdminUser = async () => {
  const adminUser = {
    username: process.env.ADMIN_USERNAME,
    email: process.env.ADMIN_EMAIL,
    phone: process.env.ADMIN_PHONE,
    password: process.env.ADMIN_PASSWORD,
    isAdmin: true,
  };
  try {
    const existingUser = await User.findOne({
      $or: [{ username: adminUser.username }, { email: adminUser.email }, { phone: adminUser.phone }, { isAdmin: true }],
    });

    if (existingUser) {
      console.log("El usuario administrador ya existe");
      return;
    }

    const newAdminUser = new User(adminUser);
    await newAdminUser.save();
    console.log("Usuario administrador creado correctamente");
  } catch (error) {
    console.error("Error al crear el usuario administrador", error);
  }
};

const updatePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.session.user?._id; // Obtener el ID del usuario de la sesión
  if (!userId) {
    return res.status(401).json({ message: "No estás autenticado" });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }
    user.password = newPassword;
    await user.save();
    return res.status(200).json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    return res.status(500).json({ message: "Error al actualizar la contraseña" });
  }
};

export { registerUser, loginUser, logoutUser, updateProfile, createAdminUser, updatePassword };
