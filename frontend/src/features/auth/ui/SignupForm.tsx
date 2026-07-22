import { Link } from 'react-router-dom'
import { ErrorMessages } from '@shared/ui'
import { useSignupForm } from '../model/useSignupForm'

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
    <section className="signup-card" aria-labelledby="signup-title">
      <header className="signup-header">
        <h1 className="signup-title" id="signup-title">
          Necton RD
        </h1>
        <p className="signup-subtitle">새 계정을 생성해 주세요</p>
      </header>

      {globalError && (
        <div className="signup-form-errors" role="alert">
          <p>{globalError}</p>
        </div>
      )}

      {errors.non_field_errors && (
        <div className="signup-form-errors" role="alert">
          <ErrorMessages
            messages={errors.non_field_errors}
            className="signup-error"
          />
        </div>
      )}

      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="signup-field">
          <label className="signup-label" htmlFor="signup-email">
            이메일 <span className="signup-required" aria-hidden="true">*</span>
          </label>
          <input
            className={`signup-input${errors.email ? ' signup-input--error' : ''}`}
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
            className="signup-error"
          />
        </div>

        <div className="signup-field">
          <label className="signup-label" htmlFor="signup-password">
            비밀번호 <span className="signup-required" aria-hidden="true">*</span>
          </label>
          <input
            className={`signup-input${errors.password ? ' signup-input--error' : ''}`}
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
            className="signup-error"
          />
        </div>

        <div className="signup-field">
          <label className="signup-label" htmlFor="signup-password-confirm">
            비밀번호 확인{' '}
            <span className="signup-required" aria-hidden="true">*</span>
          </label>
          <input
            className={`signup-input${errors.password_confirm ? ' signup-input--error' : ''}`}
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
            className="signup-error"
          />
        </div>

        <div className="signup-field">
          <label className="signup-label" htmlFor="signup-nickname">
            닉네임
          </label>
          <input
            className={`signup-input${errors.nickname ? ' signup-input--error' : ''}`}
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
            className="signup-error"
          />
        </div>

        <div className="signup-field">
          <label className="signup-label" htmlFor="signup-phone">
            핸드폰 번호
          </label>
          <input
            className={`signup-input${errors.phone ? ' signup-input--error' : ''}`}
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
            className="signup-error"
          />
        </div>

        <div className="signup-field">
          <label className="signup-label" htmlFor="signup-company">
            회사명
          </label>
          <input
            className={`signup-input${errors.company ? ' signup-input--error' : ''}`}
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
            className="signup-error"
          />
        </div>

        <button className="signup-submit" type="submit" disabled={isSubmitting}>
          가입하기
        </button>

        <p className="signup-switch">
          이미 계정이 있으신가요?
          <Link className="signup-link" to="/login">
            로그인
          </Link>
        </p>
      </form>
    </section>
  )
}
