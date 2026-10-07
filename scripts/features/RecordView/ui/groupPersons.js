import getPersonRoleLabel from './getPersonRoleLabel';

export default function groupPersons(persons = []) {
  const grouped = new Map();
  persons.forEach((person, index) => {
    const groupKey = person.id ? `id:${person.id}` : `entry:${index}`;
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, {
        ...person, groupKey, roles: [], isInformant: false,
      });
    }
    const entry = grouped.get(groupKey);
    const role = getPersonRoleLabel(person.relation);
    if (role && !entry.roles.includes(role)) entry.roles.push(role);
    if (['i', 'informant'].includes(person.relation)) entry.isInformant = true;
  });
  return Array.from(grouped.values());
}
