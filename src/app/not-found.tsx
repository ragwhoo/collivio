import ErrorOne, { defaultErrorOneAction } from "@/components/error-one";

export default function NotFound() {
  return (
    <ErrorOne
      code="404"
      title="No, no, that's right."
      description="This is a 404 page. And this page exists, no matter what anyone says."
      action={defaultErrorOneAction}
    />
  );
}
