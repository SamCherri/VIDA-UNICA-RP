type LoginForm = { login: string; password: string };
type RegisterForm = { username: string; email: string; password: string };

type AuthScreenProps = {
  showRegister: boolean;
  loginForm: LoginForm;
  registerForm: RegisterForm;
  onLoginFormChange: (form: LoginForm) => void;
  onRegisterFormChange: (form: RegisterForm) => void;
  onLogin: () => void;
  onRegister: () => void;
  onToggleMode: (register: boolean) => void;
};

export function AuthScreen({
  showRegister,
  loginForm,
  registerForm,
  onLoginFormChange,
  onRegisterFormChange,
  onLogin,
  onRegister,
  onToggleMode
}: AuthScreenProps) {
  return (
    <main className="mobile-container auth-shell">
      <section className="auth-hero">
        <p className="auth-kicker">RPG urbano • mobile-first</p>
        <h1>VIDA ÚNICA RP</h1>
        <p className="auth-subtitle">Uma cidade viva. Decisões permanentes. Seu nome em cada cena.</p>
      </section>

      <section className="card auth-card">
        <h2>{showRegister ? "Criar conta" : "Entrar na cidade"}</h2>

        {showRegister ? (
          <>
            <input
              value={registerForm.username}
              placeholder="Usuário"
              onChange={(e) => onRegisterFormChange({ ...registerForm, username: e.target.value })}
            />
            <input
              value={registerForm.email}
              placeholder="E-mail"
              onChange={(e) => onRegisterFormChange({ ...registerForm, email: e.target.value })}
            />
            <input
              value={registerForm.password}
              placeholder="Senha"
              type="password"
              onChange={(e) => onRegisterFormChange({ ...registerForm, password: e.target.value })}
            />
            <button onClick={onRegister}>Criar conta</button>
            <button className="ghost" onClick={() => onToggleMode(false)}>
              Já tenho conta
            </button>
          </>
        ) : (
          <>
            <input
              value={loginForm.login}
              placeholder="Usuário ou e-mail"
              onChange={(e) => onLoginFormChange({ ...loginForm, login: e.target.value })}
            />
            <input
              value={loginForm.password}
              placeholder="Senha"
              type="password"
              onChange={(e) => onLoginFormChange({ ...loginForm, password: e.target.value })}
            />
            <button onClick={onLogin}>Entrar</button>
            <button className="ghost" onClick={() => onToggleMode(true)}>
              Criar conta
            </button>
          </>
        )}
      </section>
    </main>
  );
}
