import QuizCreateClient from "./QuizCreateClient";

export default function NewQuizPage() {
  // We keep the route simple: if user isn't authenticated, they can still open the page,
  // but the client component will handle auth + submit.
  return <QuizCreateClient />;
}


