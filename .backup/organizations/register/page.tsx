import { Metadata } from 'next';
import RegisterOrgClient from './RegisterOrgClient';

export const metadata: Metadata = {
  title: 'Register Organization | SkillBridge',
  description: 'Launch your organization on SkillBridge and connect with top talent.',
};

export default function RegisterOrgPage() {
  return <RegisterOrgClient />;
}
