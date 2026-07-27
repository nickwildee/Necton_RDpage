import { Link } from 'react-router-dom'
import { Alert, Button, ErrorMessages } from '@shared/ui'
import { useLoginForm } from '../model/useLoginForm'
import { authInputClassName, authStyles } from './authStyles'

export function LoginForm() {
  const {
    fields,
    errors,
    globalError,
    notice,
    isSubmitting,
    handleChange,
    handleSubmit,
  } = useLoginForm()

  return (
    <section className={authStyles.card} aria-labelledby="login-title">
      <header className={authStyles.header}>
        <h1 className={authStyles.title} id="login-title">
          Necton RD
        </h1>
        <p className={authStyles.subtitle}>
          등록된 계정으로 로그인해 주세요
        </p>
      </header>

      {notice && (
        <Alert className="-mt-5 mb-6">
          {notice}
        </Alert>
      )}

      {globalError && (
        <div className={authStyles.formErrors} role="alert">
          <p className={authStyles.error}>{globalError}</p>
        </div>
      )}

      {errors.non_field_errors && (
        <div className={authStyles.formErrors} role="alert">
          <ErrorMessages
            messages={errors.non_field_errors}
            className={authStyles.error}
          />
        </div>
      )}

      <form className={authStyles.form} onSubmit={handleSubmit} noValidate>
        <div className={authStyles.field}>
          <label className={authStyles.label} htmlFor="login-email">
            이메일
          </label>
          <input
            className={authInputClassName(Boolean(errors.email))}
            id="login-email"
            name="email"
            type="email"
            value={fields.email}
            onChange={handleChange}
            placeholder="name@company.com"
            autoComplete="username"
            maxLength={255}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            required
            autoFocus
          />
          <ErrorMessages
            id="login-email-error"
            messages={errors.email}
            className={authStyles.error}
          />
        </div>

        <div className={authStyles.field}>
          <label className={authStyles.label} htmlFor="login-password">
            비밀번호
          </label>
          <input
            className={authInputClassName(Boolean(errors.password))}
            id="login-password"
            name="password"
            type="password"
            value={fields.password}
            onChange={handleChange}
            placeholder="비밀번호를 입력하세요"
            autoComplete="current-password"
            maxLength={255}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={
              errors.password ? 'login-password-error' : undefined
            }
            required
          />
          <ErrorMessages
            id="login-password-error"
            messages={errors.password}
            className={authStyles.error}
          />
        </div>

        <Button
          className="mt-1 tracking-interface"
          disabled={isSubmitting}
          fullWidth
          size="large"
          type="submit"
        >
          로그인
        </Button>

        <p className={authStyles.switchText}>
          계정이 없으신가요?
          <Link className={authStyles.link} to="/signup">
            회원가입
          </Link>
        </p>
      </form>
    </section>
  )
}
