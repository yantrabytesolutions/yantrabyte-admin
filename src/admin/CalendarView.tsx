import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '../lib/supabase';
import { ServiceTicket, AmcContract, Invoice } from '../types';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface AppEvent extends Event {
  resourceId?: string;
  type: 'ticket' | 'amc' | 'invoice';
  item: any;
}

export default function CalendarView() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, amcRes, invoicesRes] = await Promise.all([
        supabase.from('service_tickets').select('*'),
        supabase.from('amc_contracts').select('*'),
        supabase.from('invoices').select('*').gt('balance_due', 0),
      ]);

      const newEvents: AppEvent[] = [];

      if (ticketsRes.data) {
        ticketsRes.data.forEach((t: ServiceTicket) => {
          if (t.created_at) {
            newEvents.push({
              title: `Ticket ${t.ticket_number} - ${t.customer_name}`,
              start: new Date(t.created_at),
              end: new Date(t.created_at),
              allDay: true,
              type: 'ticket',
              item: t
            });
          }
        });
      }

      if (amcRes.data) {
        amcRes.data.forEach((a: AmcContract) => {
          if (a.end_date) {
            newEvents.push({
              title: `AMC Expire: ${a.client_name}`,
              start: new Date(a.end_date),
              end: new Date(a.end_date),
              allDay: true,
              type: 'amc',
              item: a
            });
          }
        });
      }

      if (invoicesRes.data) {
        invoicesRes.data.forEach((i: Invoice) => {
          if (i.due_date) {
            newEvents.push({
              title: `Due: ?${i.balance_due} - ${i.customer_name}`,
              start: new Date(i.due_date),
              end: new Date(i.due_date),
              allDay: true,
              type: 'invoice',
              item: i
            });
          }
        });
      }

      setEvents(newEvents);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const eventStyleGetter = (event: AppEvent) => {
    let backgroundColor = '#3174ad';
    if (event.type === 'amc') backgroundColor = '#ef4444'; // red for expiry
    if (event.type === 'invoice') backgroundColor = '#f59e0b'; // amber for due
    if (event.type === 'ticket') backgroundColor = '#0ea5e9'; // blue for tickets

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="h-[800px] bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <CalendarIcon className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Schedule & Calendar</h2>
        {loading && <Loader2 className="w-5 h-5 animate-spin text-blue-600 ml-4" />}
      </div>
      
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 rounded-full bg-[#0ea5e9]"></div>
          Service Tickets (Created)
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
          AMC Expirations
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
          Invoice Due Dates
        </div>
      </div>

      <div className="flex-1">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day']}
          defaultView="month"
          tooltipAccessor={(e: AppEvent) => e.title as string}
        />
      </div>
    </div>
  );
}
