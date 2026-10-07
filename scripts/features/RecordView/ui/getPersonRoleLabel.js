import { l } from '../../../lang/Lang';

const roleLabels = {
  c: 'Insamlare',
  collector: 'Insamlare',
  i: 'Informant',
  informant: 'Informant',
  excerpter: 'Excerpist',
  author: 'Författare',
  recorder: 'Inspelad av',
  photographer: 'Fotograf',
  interviewer: 'Intervjuare',
  mentioned: 'Omnämnd',
  artist: 'Konstnär',
  illustrator: 'Illustratör',
  sender: 'Avsändare',
  receiver: 'Mottagare',
};

export default function getPersonRoleLabel(relation) {
  return Object.prototype.hasOwnProperty.call(roleLabels, relation) ? l(roleLabels[relation]) : '';
}
