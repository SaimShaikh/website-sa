"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, User, CalendarPlus } from "lucide-react";
function parseICS(icsString: string) {
    const events: any[] = [];
    const lines = icsString.split(/\r?\n/);
    let currentEvent: any = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith('BEGIN:VEVENT')) {
            currentEvent = {};
        } else if (line.startsWith('END:VEVENT')) {
            if (currentEvent && currentEvent.start) {
                events.push(currentEvent);
            }
            currentEvent = null;
        } else if (currentEvent) {
            if (line.startsWith('SUMMARY:')) currentEvent.summary = line.substring(8);
            if (line.startsWith('DESCRIPTION:')) currentEvent.description = line.substring(12);
            if (line.startsWith('LOCATION:')) currentEvent.location = line.substring(9);

            if (line.startsWith('DTSTART:')) {
                // e.g. DTSTART:20260315T140000Z
                const raw = line.substring(8);
                if (raw.length === 8) {
                    // All day event: 20260315 -> 2026-03-15
                    currentEvent.start = `${raw.substring(0, 4)}-${raw.substring(4, 6)}-${raw.substring(6, 8)}T00:00:00Z`;
                    currentEvent.isAllDay = true;
                } else if (raw.includes('T')) {
                    // 20260315T140000Z -> 2026-03-15T14:00:00Z
                    const r = raw.replace('Z', '');
                    currentEvent.start = `${r.substring(0, 4)}-${r.substring(4, 6)}-${r.substring(6, 8)}T${r.substring(9, 11)}:${r.substring(11, 13)}:${r.substring(13, 15)}Z`;
                }
            }
            if (line.startsWith('DTEND:')) {
                const raw = line.substring(6);
                if (raw.length === 8) {
                    currentEvent.end = `${raw.substring(0, 4)}-${raw.substring(4, 6)}-${raw.substring(6, 8)}T00:00:00Z`;
                } else if (raw.includes('T')) {
                    const r = raw.replace('Z', '');
                    currentEvent.end = `${r.substring(0, 4)}-${r.substring(4, 6)}-${r.substring(6, 8)}T${r.substring(9, 11)}:${r.substring(11, 13)}:${r.substring(13, 15)}Z`;
                }
            }
        }
    }
    return events;
}

async function getUpcomingEvents() {
    try {
        const response = await fetch('/api/calendar'); // Fetch from local API proxy

        if (!response.ok) {
            console.error('Failed to fetch ICS file');
            return { error: "Failed to fetch events from Calendar API." };
        }

        const icsText = await response.text();
        const allEvents = parseICS(icsText);

        const now = new Date().getTime();

        // Filter: Keep events where the *end time* has not passed yet.
        // If no end time exists, assume a 1-hour duration from the start time.
        const upcomingEvents = allEvents.filter(e => {
            const startTime = new Date(e.start).getTime();
            const endTime = e.end ? new Date(e.end).getTime() : startTime + (60 * 60 * 1000);
            return endTime >= now;
        });

        // Sort by start date (closest first)
        upcomingEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

        // Limit to 6 events max
        return { events: upcomingEvents.slice(0, 6) };
    } catch (error) {
        console.error('Error fetching Google Calendar ICS events:', error);
        return { error: "Failed to fetch events." };
    }
}

// Helper to format the generated Add to Calendar URL using ICS data
function generateGoogleCalendarUrl(event: any) {
    const title = encodeURIComponent(event.summary || "Community Session");
    const details = encodeURIComponent(event.description || "");
    const location = encodeURIComponent(event.location || "Virtual / TBD");

    let startIso = "";
    let endIso = "";

    const startDate = new Date(event.start);
    startIso = startDate.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const endDate = new Date(event.end || startDate.getTime() + 60 * 60 * 1000); // fallback to 1h
    endIso = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
}

export function UpcomingSessions() {
    const [events, setEvents] = useState<any[] | null>(null);
    const [error, setError] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const result = await getUpcomingEvents();
                if (result.error) {
                    setError(true);
                } else {
                    setEvents(result.events || []);
                }
            } catch (err) {
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        fetchEvents();
    }, []);

    if (loading) {
        return (
            <section className="mb-40 mt-32">
                <h2 className="text-3xl font-bold font-mono text-brand-text mb-12 flex items-center gap-3">
                    <Calendar className="text-brand-primary" />
                    Upcoming Sessions
                </h2>
                <div className="p-8 border border-dashed border-brand-text/10 rounded-xl bg-card text-center animate-pulse">
                    <p className="text-brand-text/60">Syncing live calendar...</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="mb-40 mt-32">
                <h2 className="text-3xl font-bold font-mono text-brand-text mb-12 flex items-center gap-3">
                    <Calendar className="text-brand-primary" />
                    Upcoming Sessions
                </h2>
                <div className="p-8 border border-dashed border-red-500/20 rounded-xl bg-red-500/5 text-center">
                    <Calendar className="w-12 h-12 text-red-500/40 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-red-400 mb-2">Calendar Sync Error</h3>
                    <p className="text-brand-text/60 max-w-md mx-auto">
                        Unable to synchronize sessions from the public calendar URL at this time.
                    </p>
                </div>
            </section>
        )
    }

    if (!events || events.length === 0) {
        return (
            <section className="mb-40 mt-32">
                <h2 className="text-3xl font-bold font-mono text-brand-text mb-12 flex items-center gap-3">
                    <Calendar className="text-brand-primary" />
                    Upcoming Sessions
                </h2>
                <div className="p-8 border border-dashed border-brand-text/10 rounded-xl bg-card text-center">
                    <p className="text-brand-text/60">No upcoming sessions are currently scheduled.</p>
                </div>
            </section>
        );
    }

    return (
        <section className="mb-40 mt-32">
            <h2 className="text-3xl font-bold font-mono text-brand-text mb-12 flex items-center gap-3">
                <Calendar className="text-brand-primary" />
                Upcoming Sessions
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event, i) => {

                    const startDate = new Date(event.start);
                    // Check if it's an all day event (usually 00:00:00)
                    const isAllDay = event.isAllDay;
                    const timeString = isAllDay
                        ? "All Day"
                        : startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

                    return (
                        <div
                            key={event.uid || i}
                            className="group relative overflow-hidden rounded-xl bg-card border border-brand-primary/10 p-6 flex flex-col hover:border-brand-primary/30 transition-all shadow-lg animate-in fade-in slide-in-from-bottom-4"
                            style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
                        >
                            {/* Status Badge */}
                            <div className="mb-6 flex justify-between items-start">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                                    </span>
                                    Live Sync
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-brand-text group-hover:text-brand-primary transition-colors mb-3">
                                {event.summary || "Untitled Session"}
                            </h3>

                            <p className="text-sm text-brand-text/60 leading-relaxed mb-6 flex-grow line-clamp-3">
                                {event.description || "No description provided."}
                            </p>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-3 text-sm text-brand-text/80 font-mono">
                                    <Calendar size={16} className="text-brand-primary" />
                                    {startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-brand-text/80 font-mono">
                                    <Clock size={16} className="text-brand-primary" />
                                    {timeString}
                                </div>
                                {event.location && (
                                    <div className="flex items-center gap-3 text-sm text-brand-text/80 font-mono">
                                        <MapPin size={16} className="text-brand-primary shrink-0" />
                                        <span className="truncate">{event.location}</span>
                                    </div>
                                )}
                            </div>

                            {/* Add to Calendar Button */}
                            <a
                                href={generateGoogleCalendarUrl(event)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-auto w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-brand-primary/10 text-brand-primary font-bold text-sm tracking-wide hover:bg-brand-primary hover:text-white transition-all group-hover:shadow-[0_0_20px_rgba(0,194,255,0.3)]"
                            >
                                <CalendarPlus size={18} />
                                Add to Calendar
                            </a>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
