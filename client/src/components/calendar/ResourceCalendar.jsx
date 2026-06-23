import React, { useMemo, useState } from 'react';
import './ResourceCalendar.css';

const dateKey = (value) => String(value || '').slice(0, 10);

const addDaysIso = (isoDate, days) => {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
};

const formatDay = (isoDate) => {
  const date = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  }).format(date);
};

const buildDates = ({ startDate, days }) => (
  Array.from({ length: Number(days || 7) }, (_item, index) => addDaysIso(startDate, index))
);

const assignmentTouchesDate = (assignment, date) => {
  const start = dateKey(assignment.startDate);
  const end = dateKey(assignment.endDate || assignment.startDate);
  return date >= start && date <= end;
};

export default function ResourceCalendar({
  resources = [],
  assignments = [],
  startDate = new Date().toISOString().slice(0, 10),
  days = 7,
  unassignedLabel = 'Sin asignar',
  onCreateAssignment,
  onOpenAssignment,
  onMoveAssignment,
  canDropAssignment
}) {
  const [draggingId, setDraggingId] = useState('');
  const [dropTarget, setDropTarget] = useState('');
  const dates = useMemo(() => buildDates({ startDate, days }), [startDate, days]);
  const visibleAssignments = useMemo(() => (
    assignments.filter((assignment) => dates.some((date) => assignmentTouchesDate(assignment, date)))
  ), [assignments, dates]);

  const assignmentsForCell = (resourceId, date) => (
    visibleAssignments
      .filter((assignment) => String(assignment.resourceId || '') === String(resourceId || '') && assignmentTouchesDate(assignment, date))
      .sort((left, right) => String(left.startTime || '').localeCompare(String(right.startTime || '')))
  );

  const handleDrop = async (event, resourceId, date) => {
    event.preventDefault();
    const assignmentId = draggingId || event.dataTransfer.getData('text/plain');
    if (!assignmentId) return;
    const allowed = canDropAssignment
      ? await canDropAssignment({ assignmentId, nextResourceId: resourceId, nextStartDate: date })
      : true;
    if (!allowed) return;
    await onMoveAssignment?.({ assignmentId, nextResourceId: resourceId, nextStartDate: date });
    setDraggingId('');
    setDropTarget('');
  };

  const statusClass = (status) => (
    String(status || 'default')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'default'
  );

  const renderAssignment = (assignment) => (
    <button
      key={assignment.id}
      type="button"
      className={`resource-calendar__assignment is-${statusClass(assignment.status)}`}
      draggable={assignment.draggable !== false}
      style={{ '--assignment-color': assignment.color || '#2563eb' }}
      onClick={() => onOpenAssignment?.({ assignmentId: assignment.id })}
      onDragStart={(event) => {
        setDraggingId(assignment.id);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', assignment.id);
      }}
      onDragEnd={() => setDraggingId('')}>
      <strong>{assignment.title}</strong>
      <span>{assignment.subtitle || assignment.startTime || assignment.status}</span>
    </button>
  );

  const renderCell = (resourceId, date) => {
    const cellAssignments = assignmentsForCell(resourceId, date);
    const targetKey = `${resourceId || 'unassigned'}-${date}`;
    return (
      <div
        key={`${resourceId || 'unassigned'}-${date}`}
        className={`resource-calendar__cell ${cellAssignments.length ? 'is-busy' : 'is-free'} ${dropTarget === targetKey ? 'is-drop-target' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDropTarget(targetKey);
        }}
        onDragLeave={() => setDropTarget((current) => current === targetKey ? '' : current)}
        onDrop={(event) => handleDrop(event, resourceId, date)}
        onDoubleClick={() => onCreateAssignment?.({ resourceId, date })}>
        {cellAssignments.length ? cellAssignments.map(renderAssignment) : <span>Libre</span>}
      </div>
    );
  };

  return (
    <section className="resource-calendar" style={{ '--day-count': dates.length }}>
      <div className="resource-calendar__corner">Recurso</div>
      {dates.map((date) => (
        <div key={date} className="resource-calendar__day">
          <span>{formatDay(date).split(' ')[0]}</span>
          <strong>{formatDay(date).replace(',', '').split(' ').slice(1).join(' ')}</strong>
        </div>
      ))}

      {resources.map((resource) => (
        <React.Fragment key={resource.id}>
          <div className="resource-calendar__resource">
            <strong>{resource.label}</strong>
            <span>{resource.subtitle}</span>
          </div>
          {dates.map((date) => renderCell(resource.id, date))}
        </React.Fragment>
      ))}

      <div className="resource-calendar__resource resource-calendar__resource--unassigned">
        <strong>{unassignedLabel}</strong>
        <span>{assignments.filter((assignment) => !assignment.resourceId).length} pendientes</span>
      </div>
      {dates.map((date) => renderCell('', date))}
    </section>
  );
}
