import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
// IMPORTANTE: Garantir que você importe os estilos corretos para esta página
import styles from '../styles/signup.module.css'; 

export default function Signup() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const nomeRef = useRef(null); // Foco no primeiro campo

  useEffect(() => {
    if (nomeRef.current) nomeRef.current.focus();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    setMsg('');
    setIsError(false);

    // Validação básica
    if (senha !== confirmaSenha) {
      setIsError(true);
      setMsg('As senhas não coincidem.');
      return;
    }

    if (usuario.length < 5 || senha.length < 6) {
      setIsError(true);
      setMsg('Verifique os requisitos mínimos de caracteres.');
      return;
    }

    if (typeof window === 'undefined') return;

    // Lógica para salvar usuário no localStorage (Reutilizando a lógica do Login)
    const listaUser = JSON.parse(localStorage.getItem('listaUser') || '[]');
    const userExists = listaUser.some((u) => u.userCad === usuario);

    if (userExists) {
      setIsError(true);
      setMsg('Usuário já cadastrado.');
      return;
    }

    listaUser.push({
      nomeCad: nome,
      userCad: usuario,
      senhaCad: senha,
    });
    localStorage.setItem('listaUser', JSON.stringify(listaUser));

    setIsError(false);
    setMsg('Cadastro realizado com sucesso! Faça login.');

    // Redireciona para a página de login após 2 segundos
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  }

  const containerClass = `${styles.container} ${isError ? styles.hasError : ''}`;

  return (
    <>
      <Head>
        <title>Criar Conta - Smart Farm</title>
      </Head>

      {/* centraliza apenas o card de cadastro (usa styles.page) */}
      <div className={styles.page}>
        <div className={containerClass}>
          <div className={styles.logo}>Smart Farm</div>

          <h1 className={styles.title}>Criar Conta</h1>
          <p className={styles.loginSubtitle}>Sistema de Monitoramento Inteligente</p>

          {msg && (
            <div
              id="msgError"
              className={`${styles.message} ${isError ? styles.error : styles.success}`}
              aria-live="polite"
            >
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Campo Nome Completo */}
            <div className={styles.formGroup}>
              <label htmlFor="nome" className={styles.label}>
                Nome Completo
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  ref={nomeRef}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>

            {/* Campo Usuário */}
            <div className={styles.formGroup}>
              <label htmlFor="usuario" className={styles.label}>
                Usuário
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="usuario"
                  name="usuario"
                  type="text"
                  required
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className={styles.input}
                  minLength={5}
                />
              </div>
              <small className={styles.minChar}>Mínimo 5 caracteres</small>
            </div>

            {/* Campo Senha */}
            <div className={styles.formGroup}>
              <label htmlFor="senha" className={styles.label}>
                Senha
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="senha"
                  name="senha"
                  type={showSenha ? 'text' : 'password'}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={styles.input}
                  minLength={6}
                />
                <button
                  type="button"
                  id="toggleSenha"
                  className={styles.togglePassword}
                  aria-label="Mostrar/ocultar senha"
                  onClick={() => setShowSenha((s) => !s)}
                >
                  {showSenha ? '🙈' : '👁️'}
                </button>
              </div>
              <small className={styles.minChar}>Mínimo 6 caracteres</small>
            </div>

            {/* Campo Confirmar Senha */}
            <div className={styles.formGroup}>
              <label htmlFor="confirmaSenha" className={styles.label}>
                Confirmar Senha
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="confirmaSenha"
                  name="confirmaSenha"
                  type={showSenha ? 'text' : 'password'}
                  required
                  value={confirmaSenha}
                  onChange={(e) => setConfirmaSenha(e.target.value)}
                  className={styles.input}
                />
                <button
                  type="button"
                  id="toggleConfirmaSenha"
                  className={styles.togglePassword}
                  aria-label="Mostrar/ocultar senha"
                  onClick={() => setShowSenha((s) => !s)}
                >
                  {showSenha ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Botão de Cadastro */}
            <div className={styles.formGroup}>
              <button type="submit" className={styles.btn}>
                Cadastrar
              </button>
            </div>
          </form>

          <hr className={styles.hr} />

          <p className={styles.linkText}>
            Já tem uma conta? <a href="/login">Fazer login</a>
          </p>
        </div>
      </div>
    </>
  );
}