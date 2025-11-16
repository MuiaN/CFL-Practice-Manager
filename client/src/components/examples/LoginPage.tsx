import LoginPage from "../LoginPage";

export default function LoginPageExample() {
  return <LoginPage onLoginSuccess={() => console.log("Login success")} />;
}
