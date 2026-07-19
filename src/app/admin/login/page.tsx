import type { Metadata } from "next";

import styles from "./admin-login.module.css";

export const metadata: Metadata = {
  title: "Operations Login | ELO Trail",
  robots: {
    index: false,
    follow: false,
  },
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    next?: string | string[];
  }>;
};

function getSingleValue(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function getErrorMessage(error: string): string | null {
  if (error === "invalid") {
    return "The username or password was not accepted.";
  }

  if (error === "configuration") {
    return "Administrator authentication is not configured.";
  }

  return null;
}

function getSafeDestination(value: string): string {
  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
  ) {
    return value;
  }

  return "/admin/observability";
}

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  const error = getSingleValue(params.error);
  const destination = getSafeDestination(getSingleValue(params.next));
  const errorMessage = getErrorMessage(error);

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="admin-login-title">
        <div className={styles.heading}>
          <p className={styles.eyebrow}>ELO Trail Operations</p>

          <h1 id="admin-login-title">Administrator sign in</h1>

          <p>Sign in to view the private observability dashboard.</p>
        </div>

        {errorMessage ? (
          <p className={styles.error} role="alert">
            {errorMessage}
          </p>
        ) : null}

        <form className={styles.form} action="/api/admin/session" method="post">
          <input type="hidden" name="next" value={destination} />

          <label className={styles.field}>
            <span>Username</span>

            <input
              name="username"
              type="text"
              autoComplete="username"
              required
              autoFocus
            />
          </label>

          <label className={styles.field}>
            <span>Password</span>

            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          <button className={styles.submit} type="submit">
            Sign in
          </button>
        </form>

        <p className={styles.notice}>
          Access is restricted to authorised ELO Trail administrators.
        </p>
      </section>
    </main>
  );
}
