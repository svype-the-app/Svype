import { Redirect } from 'expo-router';

export default function ApplicantsIndexRedirect() {
  return <Redirect href="/(company)/applicants/review-applicants" />;
}
