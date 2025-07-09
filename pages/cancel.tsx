import { NextPage, GetServerSideProps } from "next";
import Head from "next/head";
import { useEffect } from "react";

interface CancelProps {
  hasSessionId: boolean;
}

export const getServerSideProps: GetServerSideProps<CancelProps> = async ({
  req,
  query,
}) => {
  const sessionId = query.session_id;
  const hasSessionId = typeof sessionId === "string" && sessionId.trim() !== "";

  return {
    props: {
      hasSessionId,
    },
  };
};

const Cancel: NextPage<CancelProps> = ({ hasSessionId }) => {
  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const session_id = urlParams.get("session_id");

    if (!session_id) {
      window.location.href = "/";
    }

    const redirectHome = setTimeout(() => {
      window.location.href = "/";
    }, 2000);

    return () => clearTimeout(redirectHome);
  }, []);

  if (!hasSessionId) {
    useEffect(() => {
      window.location.href = "/";
    }, []);

    return (
      <>
        <Head>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="min-h-screen flex justify-center items-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-4xl font-bold text-red-600 mb-4">
              Access Denied
            </h2>
            <p className="text-lg text-gray-700">
              You are not authorized to access this page.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Payment Canceled | You canceled the payment!</title>
      </Head>
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-4xl font-bold text-red-600 mb-4">
            You canceled the payment!
          </h2>
          <p className="text-lg text-gray-700">
            Your payment process was canceled. You will be redirected to the
            homepage shortly.
          </p>
        </div>
      </div>
    </>
  );
};

export default Cancel;
