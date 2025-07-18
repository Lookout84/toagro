import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, User, Phone, Eye, EyeOff, Building, Briefcase, ChevronRight } from "lucide-react";
import { Button, Input, Alert, Tabs, Tab } from "../components/common";

// Типи для форми реєстрації
type AccountType = "USER" | "COMPANY";

interface UserFormData {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

// Add role type for registration
type UserRole = "USER" | "COMPANY";

// Registration data to be sent to the server
interface RegisterFormData {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: UserRole; // <-- Ensure 'role' is present
  companyProfile?: {
    companyName: string;
    companyCode: string;
    vatNumber?: string;
    industry?: string;
    website?: string;
  };
}

interface CompanyFormData extends UserFormData {
  companyName: string;
  companyCode: string; // ЄДРПОУ
  vatNumber?: string; // ІПН
  industry?: string;
  website?: string;
}

const RegisterPage = () => {
  // Тип облікового запису (USER або COMPANY)
  const [accountType, setAccountType] = useState<AccountType>("USER");
  
  // Загальні дані для всіх типів користувачів
  const [userFormData, setUserFormData] = useState<UserFormData>({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  
  // Додаткові дані для компаній
  const [companyFormData, setCompanyFormData] = useState<Omit<CompanyFormData, keyof UserFormData>>({
    companyName: "",
    companyCode: "",
    vatNumber: "",
    industry: "",
    website: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Обробник зміни типу облікового запису
  const handleAccountTypeChange = (index: number) => {
    setAccountType(index === 0 ? "USER" : "COMPANY");
    setErrors({});
    setServerError(null);
  };

  // Обробник зміни полів форми користувача
  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserFormData((prev) => ({ ...prev, [name]: value }));
    
    // Очищаємо помилку поля при редагуванні
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Обробник зміни полів форми компанії
  const handleCompanyFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyFormData((prev) => ({ ...prev, [name]: value }));
    
    // Очищаємо помилку поля при редагуванні
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Валідація форми користувача
  const validateUserForm = () => {
    const newErrors: Record<string, string> = {};

    if (!userFormData.name.trim()) {
      newErrors.name = "Введіть ваше ім'я";
    }

    if (!userFormData.email) {
      newErrors.email = "Введіть email";
    } else if (!/\S+@\S+\.\S+/.test(userFormData.email)) {
      newErrors.email = "Введіть коректний email";
    }

    if (
      userFormData.phoneNumber &&
      !/^(\+?38)?\d{10}$/.test(userFormData.phoneNumber.replace(/\s/g, ""))
    ) {
      newErrors.phoneNumber = "Введіть коректний номер телефону";
    }

    if (!userFormData.password) {
      newErrors.password = "Введіть пароль";
    } else if (userFormData.password.length < 6) {
      newErrors.password = "Пароль має бути не менше 6 символів";
    }

    if (userFormData.password !== userFormData.confirmPassword) {
      newErrors.confirmPassword = "Паролі не співпадають";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Валідація форми компанії
  const validateCompanyForm = () => {
    const newErrors: Record<string, string> = {};

    if (!companyFormData.companyName.trim()) {
      newErrors.companyName = "Введіть назву компанії";
    }

    if (!companyFormData.companyCode.trim()) {
      newErrors.companyCode = "Введіть код ЄДРПОУ";
    } else if (!/^\d{8}$/.test(companyFormData.companyCode.trim())) {
      newErrors.companyCode = "Код ЄДРПОУ повинен містити 8 цифр";
    }

    if (companyFormData.vatNumber && !/^\d{10}$/.test(companyFormData.vatNumber.trim())) {
      newErrors.vatNumber = "ІПН повинен містити 10 цифр";
    }

    if (companyFormData.website && 
      !/^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/.test(companyFormData.website)) {
      newErrors.website = "Введіть коректний URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обробка наступного кроку
  const handleNextStep = () => {
    if (validateUserForm()) {
      setRegistrationStep(2);
    }
  };

  // Обробник подання форми
  // Змініть обробник форми на:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setServerError(null);

  if (accountType === "USER") {
    if (!validateUserForm()) {
      return;
    }
  } else {
    // Для компанії перевіряємо обидві форми
    if (registrationStep === 1) {
      if (validateUserForm()) {
        setRegistrationStep(2);
      }
      return;
    } else {
      if (!validateCompanyForm()) {
        return;
      }
    }
  }

  setIsSubmitting(true);

  try {
    // Підготовка даних для відправки
    const { confirmPassword: _confirmPassword, ...userData } = userFormData;
    
    if (accountType === "USER") {
      // Реєстрація звичайного користувача
      await register({
        ...userData,
        role: "USER" as UserRole
      } as RegisterFormData);
    } else {
      // Реєстрація компанії
      // Правильно структуруємо об'єкт для API
      await register({
        name: userData.name,
        email: userData.email,
        phoneNumber: userData.phoneNumber || undefined, // уникаємо пустих рядків
        password: userData.password,
        role: "COMPANY" as UserRole,
        companyProfile: {
          companyName: companyFormData.companyName,
          companyCode: companyFormData.companyCode,
          vatNumber: companyFormData.vatNumber || undefined,
          industry: companyFormData.industry || undefined,
          website: companyFormData.website || undefined
        }
      } as RegisterFormData);
    }
    
    navigate("/verify-email"); // Перенаправляємо на сторінку з інструкціями перевірки email
  } catch (error: any) {
    console.error("Registration error:", error);
    
    // Більш детальна обробка помилок
    if (error.response) {
      if (error.response.status === 400) {
        // Помилка валідації
        if (error.response.data?.errors) {
          const serverErrors: Record<string, string> = {};
          
          // Обробка специфічних помилок від сервера
          Object.entries(error.response.data.errors).forEach(([key, value]) => {
            if (key.startsWith('companyProfile.')) {
              // Витягуємо назву поля компанії
              const fieldName = key.replace('companyProfile.', '');
              serverErrors[fieldName] = Array.isArray(value) ? value[0] : value as string;
            } else {
              serverErrors[key] = Array.isArray(value) ? value[0] : value as string;
            }
          });
          
          setErrors(prev => ({ ...prev, ...serverErrors }));
        } else {
          setServerError(error.response.data?.message || "Неправильні дані для реєстрації");
        }
      } else if (error.response.status === 500) {
        setServerError("Помилка сервера. Спробуйте пізніше або зверніться до служби підтримки.");
      } else if (error.response.status === 409) {
        // Конфлікт (наприклад, email або код ЄДРПОУ вже використовуються)
        setServerError(error.response.data?.message || "Користувач з такими даними вже існує");
      } else {
        setServerError("Помилка при реєстрації. Спробуйте пізніше.");
      }
    } else {
      setServerError("Не вдалося з'єднатися з сервером. Перевірте з'єднання.");
    }
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-green-600 p-6">
          <h2 className="text-2xl font-bold text-white text-center">
            Реєстрація
          </h2>
        </div>

        <div className="p-6">
          {/* Перемикач типу облікового запису */}
          <Tabs defaultActiveTab={accountType === "USER" ? 0 : 1} onChange={handleAccountTypeChange}>
            <Tab title="Фізична особа">
              <div className="py-4">
                <div className="flex items-center mb-4">
                  <User className="text-green-600 mr-2" size={24} />
                  <p className="text-gray-700">
                    Реєстрація для приватних осіб
                  </p>
                </div>
              </div>
            </Tab>
            <Tab title="Компанія">
              <div className="py-4">
                <div className="flex items-center mb-4">
                  <Building className="text-green-600 mr-2" size={24} />
                  <p className="text-gray-700">
                    Реєстрація для компаній та підприємств
                  </p>
                </div>
              </div>
            </Tab>
          </Tabs>

          {serverError && (
            <Alert type="error" message={serverError} className="mb-4" />
          )}

          <form onSubmit={handleSubmit}>
            {/* Форма для звичайного користувача або перший крок для компанії */}
            {(accountType === "USER" || (accountType === "COMPANY" && registrationStep === 1)) && (
              <>
                {/* Ім'я */}
                <div className="mb-4">
                  <label
                    htmlFor="name"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    {accountType === "USER" ? "Ім'я та прізвище" : "Ім'я контактної особи"}
                  </label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    placeholder={accountType === "USER" ? "Введіть ваше ім'я та прізвище" : "Введіть ім'я контактної особи"}
                    icon={<User size={20} className="text-gray-400" />}
                    value={userFormData.name}
                    onChange={handleUserFormChange}
                    error={errors.name || ""}
                  />
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label
                    htmlFor="email"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Email
                  </label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Введіть ваш email"
                    icon={<Mail size={20} className="text-gray-400" />}
                    value={userFormData.email}
                    onChange={handleUserFormChange}
                    error={errors.email || ""}
                  />
                </div>

                {/* Телефон */}
                <div className="mb-4">
                  <label
                    htmlFor="phoneNumber"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    {accountType === "USER" ? "Номер телефону (необов'язково)" : "Номер телефону контактної особи"}
                  </label>
                  <Input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    placeholder="+380 XX XXX XX XX"
                    icon={<Phone size={20} className="text-gray-400" />}
                    value={userFormData.phoneNumber}
                    onChange={handleUserFormChange}
                    error={errors.phoneNumber || ""}
                  />
                </div>

                {/* Пароль */}
                <div className="mb-4">
                  <label
                    htmlFor="password"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Пароль
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      placeholder="Створіть пароль"
                      icon={<Lock size={20} className="text-gray-400" />}
                      value={userFormData.password}
                      onChange={handleUserFormChange}
                      error={errors.password || ""}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Підтвердження пароля */}
                <div className="mb-6">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Підтвердження пароля
                  </label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Повторіть пароль"
                    icon={<Lock size={20} className="text-gray-400" />}
                    value={userFormData.confirmPassword}
                    onChange={handleUserFormChange}
                    error={errors.confirmPassword || ""}
                  />
                </div>

                {/* Кнопка дії */}
                {accountType === "USER" ? (
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isSubmitting}
                    fullWidth
                  >
                    {isSubmitting ? "Реєстрація..." : "Зареєструватися"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    endIcon={<ChevronRight size={16} />}
                    onClick={handleNextStep}
                    fullWidth
                  >
                    Далі
                  </Button>
                )}
              </>
            )}

            {/* Другий крок для компанії */}
            {accountType === "COMPANY" && registrationStep === 2 && (
              <>
                <div className="mb-6 border-b pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Інформація про компанію
                  </h3>
                  <p className="text-sm text-gray-600">
                    Будь ласка, заповніть дані про вашу компанію для реєстрації
                  </p>
                </div>

                {/* Назва компанії */}
                <div className="mb-4">
                  <label
                    htmlFor="companyName"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Назва компанії
                  </label>
                  <Input
                    type="text"
                    id="companyName"
                    name="companyName"
                    placeholder="Введіть назву компанії"
                    icon={<Building size={20} className="text-gray-400" />}
                    value={companyFormData.companyName}
                    onChange={handleCompanyFormChange}
                    error={errors.companyName || ""}
                  />
                </div>

                {/* Код ЄДРПОУ */}
                <div className="mb-4">
                  <label
                    htmlFor="companyCode"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Код ЄДРПОУ
                  </label>
                  <Input
                    type="text"
                    id="companyCode"
                    name="companyCode"
                    placeholder="Введіть 8-значний код ЄДРПОУ"
                    value={companyFormData.companyCode}
                    onChange={handleCompanyFormChange}
                    error={errors.companyCode || ""}
                  />
                </div>

                {/* ІПН */}
                <div className="mb-4">
                  <label
                    htmlFor="vatNumber"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    ІПН (необов&apos;язково)
                  </label>
                  <Input
                    type="text"
                    id="vatNumber"
                    name="vatNumber"
                    placeholder="Введіть 10-значний ІПН"
                    value={companyFormData.vatNumber}
                    onChange={handleCompanyFormChange}
                    error={errors.vatNumber || ""}
                  />
                </div>

                {/* Галузь */}
                <div className="mb-4">
                  <label
                    htmlFor="industry"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Галузь (необов&apos;язково)
                  </label>
                  <Input
                    type="text"
                    id="industry"
                    name="industry"
                    placeholder="Наприклад: Сільське господарство"
                    icon={<Briefcase size={20} className="text-gray-400" />}
                    value={companyFormData.industry}
                    onChange={handleCompanyFormChange}
                    error={errors.industry || ""}
                  />
                </div>

                {/* Веб-сайт */}
                <div className="mb-6">
                  <label
                    htmlFor="website"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Веб-сайт (необов&apos;язково)
                  </label>
                  <Input
                    type="url"
                    id="website"
                    name="website"
                    placeholder="https://example.com"
                    value={companyFormData.website}
                    onChange={handleCompanyFormChange}
                    error={errors.website || ""}
                  />
                </div>

                {/* Кнопки дій */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRegistrationStep(1)}
                    className="sm:flex-1"
                  >
                    Назад
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isSubmitting}
                    className="sm:flex-1"
                  >
                    {isSubmitting ? "Реєстрація..." : "Зареєструватися"}
                  </Button>
                </div>
              </>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Вже маєте обліковий запис?{" "}
              <Link
                to="/login"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Увійти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;


// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import { Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";

// const RegisterPage = () => {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     phoneNumber: "",
//     password: "",
//     confirmPassword: "",
//   });

//   const [showPassword, setShowPassword] = useState(false);
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const { register } = useAuth();
//   const navigate = useNavigate();

//   // Обробник зміни полів форми
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   // Валідація форми
//   const validateForm = () => {
//     const newErrors: Record<string, string> = {};

//     if (!formData.name.trim()) {
//       newErrors.name = "Введіть ваше ім'я";
//     }

//     if (!formData.email) {
//       newErrors.email = "Введіть email";
//     } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
//       newErrors.email = "Введіть коректний email";
//     }

//     if (
//       formData.phoneNumber &&
//       !/^(\+?38)?\d{10}$/.test(formData.phoneNumber.replace(/\s/g, ""))
//     ) {
//       newErrors.phoneNumber = "Введіть коректний номер телефону";
//     }

//     if (!formData.password) {
//       newErrors.password = "Введіть пароль";
//     } else if (formData.password.length < 6) {
//       newErrors.password = "Пароль має бути не менше 6 символів";
//     }

//     if (formData.password !== formData.confirmPassword) {
//       newErrors.confirmPassword = "Паролі не співпадають";
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // Обробник подання форми
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!validateForm()) {
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       // Видаляємо поле confirmPassword перед відправкою
//       const { confirmPassword: _confirmPassword, ...registerData } = formData;

//       await register(registerData);
//       navigate("/");
//     } catch (error) {
//       console.error("Registration error:", error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="container mx-auto px-4 py-12">
//       <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md overflow-hidden">
//         <div className="bg-green-600 p-6">
//           <h2 className="text-2xl font-bold text-white text-center">
//             Реєстрація
//           </h2>
//         </div>

//         <div className="p-6">
//           <form onSubmit={handleSubmit}>
//             {/* Ім'я */}
//             <div className="mb-4">
//               <label
//                 htmlFor="name"
//                 className="block text-gray-700 font-medium mb-2"
//               >
//                 Ім&apos;я та прізвище
//               </label>
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <User size={20} className="text-gray-400" />
//                 </div>
//                 <input
//                   type="text"
//                   id="name"
//                   name="name"
//                   placeholder="Введіть ваше ім'я та прізвище"
//                   className={`block w-full pl-10 pr-3 py-2 border ${
//                     errors.name ? "border-red-500" : "border-gray-300"
//                   } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
//                   value={formData.name}
//                   onChange={handleChange}
//                 />
//               </div>
//               {errors.name && (
//                 <p className="mt-1 text-sm text-red-500">{errors.name}</p>
//               )}
//             </div>

//             {/* Email */}
//             <div className="mb-4">
//               <label
//                 htmlFor="email"
//                 className="block text-gray-700 font-medium mb-2"
//               >
//                 Email
//               </label>
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <Mail size={20} className="text-gray-400" />
//                 </div>
//                 <input
//                   type="email"
//                   id="email"
//                   name="email"
//                   placeholder="Введіть ваш email"
//                   className={`block w-full pl-10 pr-3 py-2 border ${
//                     errors.email ? "border-red-500" : "border-gray-300"
//                   } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
//                   value={formData.email}
//                   onChange={handleChange}
//                 />
//               </div>
//               {errors.email && (
//                 <p className="mt-1 text-sm text-red-500">{errors.email}</p>
//               )}
//             </div>

//             {/* Телефон */}
//             <div className="mb-4">
//               <label
//                 htmlFor="phoneNumber"
//                 className="block text-gray-700 font-medium mb-2"
//               >
//                 Номер телефону (необов&apos;язково)
//               </label>
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <Phone size={20} className="text-gray-400" />
//                 </div>
//                 <input
//                   type="tel"
//                   id="phoneNumber"
//                   name="phoneNumber"
//                   placeholder="+380 XX XXX XX XX"
//                   className={`block w-full pl-10 pr-3 py-2 border ${
//                     errors.phoneNumber ? "border-red-500" : "border-gray-300"
//                   } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
//                   value={formData.phoneNumber}
//                   onChange={handleChange}
//                 />
//               </div>
//               {errors.phoneNumber && (
//                 <p className="mt-1 text-sm text-red-500">
//                   {errors.phoneNumber}
//                 </p>
//               )}
//             </div>

//             {/* Пароль */}
//             <div className="mb-4">
//               <label
//                 htmlFor="password"
//                 className="block text-gray-700 font-medium mb-2"
//               >
//                 Пароль
//               </label>
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <Lock size={20} className="text-gray-400" />
//                 </div>
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   id="password"
//                   name="password"
//                   placeholder="Створіть пароль"
//                   className={`block w-full pl-10 pr-10 py-2 border ${
//                     errors.password ? "border-red-500" : "border-gray-300"
//                   } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
//                   value={formData.password}
//                   onChange={handleChange}
//                 />
//                 <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="text-gray-400 hover:text-gray-500 focus:outline-none"
//                   >
//                     {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                   </button>
//                 </div>
//               </div>
//               {errors.password && (
//                 <p className="mt-1 text-sm text-red-500">{errors.password}</p>
//               )}
//             </div>

//             {/* Підтвердження пароля */}
//             <div className="mb-6">
//               <label
//                 htmlFor="confirmPassword"
//                 className="block text-gray-700 font-medium mb-2"
//               >
//                 Підтвердження пароля
//               </label>
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <Lock size={20} className="text-gray-400" />
//                 </div>
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   id="confirmPassword"
//                   name="confirmPassword"
//                   placeholder="Повторіть пароль"
//                   className={`block w-full pl-10 pr-3 py-2 border ${
//                     errors.confirmPassword
//                       ? "border-red-500"
//                       : "border-gray-300"
//                   } rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500`}
//                   value={formData.confirmPassword}
//                   onChange={handleChange}
//                 />
//               </div>
//               {errors.confirmPassword && (
//                 <p className="mt-1 text-sm text-red-500">
//                   {errors.confirmPassword}
//                 </p>
//               )}
//             </div>

//             {/* Кнопка реєстрації */}
//             <button
//               type="submit"
//               disabled={isSubmitting}
//               className="w-full bg-green-600 text-white font-medium py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
//             >
//               {isSubmitting ? "Реєстрація..." : "Зареєструватися"}
//             </button>
//           </form>

//           <div className="mt-6 text-center">
//             <p className="text-gray-600">
//               Вже маєте обліковий запис?{" "}
//               <Link
//                 to="/login"
//                 className="text-green-600 hover:text-green-700 font-medium"
//               >
//                 Увійти
//               </Link>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RegisterPage;
