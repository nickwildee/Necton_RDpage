import { Link } from 'react-router-dom'
import { Button, ErrorMessages } from '@shared/ui'
import { useSignupForm } from '../model/useSignupForm'
import { authInputClassName, authStyles } from './authStyles'

export function SignupForm() {
  const {
    fields,
    errors,
    globalError,
    isSubmitting,
    handleChange,
    handleSubmit,
  } = useSignupForm()

  return (
    <section className={authStyles.card} aria-labelledby="signup-title">
      <header className={authStyles.header}>
        <h1 className={authStyles.title} id="signup-title">
          Necton RD
        </h1>
        <p className={authStyles.subtitle}>새 계정을 생성해 주세요</p>
      </header>

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

      <form className={authStyles.signupForm} onSubmit={handleSubmit}>
        <div className={authStyles.field}>
          <label className={authStyles.label} htmlFor="signup-email">
            이메일{' '}
            <span className={authStyles.required} aria-hidden="true">
              *
            </span>
          </label>
          <input
            className={authInputClassName(Boolean(errors.email))}
            id="signup-email"
            name="email"
            type="email"
            value={fields.email}
            onChange={handleChange}
            placeholder="name@company.com"
            autoComplete="email"
            maxLength={255}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'signup-email-error' : undefined}
            required
            autoFocus
          />
          <ErrorMessages
            id="signup-email-error"
            messages={errors.email}
            className={authStyles.error}
          />
        </div>

        <div className={authStyles.field}>
          <label className={authStyles.label} htmlFor="signup-password">
            비밀번호{' '}
            <span className={authStyles.required} aria-hidden="true">
              *
            </span>
          </label>
          <input
            className={authInputClassName(Boolean(errors.password))}
            id="signup-password"
            name="password"
            type="password"
            value={fields.password}
            onChange={handleChange}
            placeholder="8자 이상 입력하세요"
            autoComplete="new-password"
            minLength={8}
            maxLength={255}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={
              errors.password ? 'signup-password-error' : undefined
            }
            required
          />
          <ErrorMessages
            id="signup-password-error"
            messages={errors.password}
            className={authStyles.error}
          />
        </div>

        <div className={authStyles.field}>
          <label className={authStyles.label} htmlFor="signup-password-confirm">
            비밀번호 확인{' '}
            <span className={authStyles.required} aria-hidden="true">
              *
            </span>
          </label>
          <input
            className={authInputClassName(Boolean(errors.password_confirm))}
            id="signup-password-confirm"
            name="password_confirm"
            type="password"
            value={fields.password_confirm}
            onChange={handleChange}
            placeholder="비밀번호를 한 번 더 입력하세요"
            autoComplete="new-password"
            minLength={8}
            maxLength={255}
            aria-invalid={errors.password_confirm ? true : undefined}
            aria-describedby={
              errors.password_confirm
                ? 'signup-password-confirm-error'
                : undefined
            }
            required
          />
          <ErrorMessages
            id="signup-password-confirm-error"
            messages={errors.password_confirm}
            className={authStyles.error}
          />
        </div>

        <div className={authStyles.field}>
          <label className={authStyles.label} htmlFor="signup-nickname">
            닉네임
          </label>
          <input
            className={authInputClassName(Boolean(errors.nickname))}
            id="signup-nickname"
            name="nickname"
            type="text"
            value={fields.nickname}
            onChange={handleChange}
            placeholder="닉네임을 입력하세요"
            autoComplete="nickname"
            maxLength={255}
            aria-invalid={errors.nickname ? true : undefined}
            aria-describedby={
              errors.nickname ? 'signup-nickname-error' : undefined
            }
          />
          <ErrorMessages
            id="signup-nickname-error"
            messages={errors.nickname}
            className={authStyles.error}
          />
        </div>

        <div className={authStyles.field}>
          <label className={authStyles.label} htmlFor="signup-phone">
            핸드폰 번호
          </label>
          <input
            className={authInputClassName(Boolean(errors.phone))}
            id="signup-phone"
            name="phone"
            type="tel"
            value={fields.phone}
            onChange={handleChange}
            placeholder="01012345678"
            autoComplete="tel"
            inputMode="numeric"
            pattern="[0-9]{11}"
            minLength={11}
            maxLength={11}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? 'signup-phone-error' : undefined}
          />
          <ErrorMessages
            id="signup-phone-error"
            messages={errors.phone}
            className={authStyles.error}
          />
        </div>

        <div className={authStyles.field}>
          <label className={authStyles.label} htmlFor="signup-company">
            회사명
          </label>
          <input
            className={authInputClassName(Boolean(errors.company))}
            id="signup-company"
            name="company"
            type="text"
            value={fields.company}
            onChange={handleChange}
            placeholder="회사명을 입력하세요"
            autoComplete="organization"
            maxLength={255}
            required
            aria-invalid={errors.company ? true : undefined}
            aria-describedby={
              errors.company ? 'signup-company-error' : undefined
            }
          />
          <ErrorMessages
            id="signup-company-error"
            messages={errors.company}
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
          가입하기
        </Button>

        <p className={authStyles.switchText}>
          이미 계정이 있으신가요?
          <Link className={authStyles.link} to="/login">
            로그인
          </Link>
        </p>
      </form>
    </section>
  )
}
