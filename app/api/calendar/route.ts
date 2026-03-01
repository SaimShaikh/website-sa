import { NextResponse } from 'next/server';

const CALENDAR_URL = "https://calendar.google.com/calendar/ical/6e5dabfdd8707cb74a4dca7c6afc01a7a43520a2dbb5044ec1af72f70bee3bf3%40group.calendar.google.com/public/basic.ics";

export async function GET() {
    try {
        const response = await fetch(CALENDAR_URL, {
            next: { revalidate: 60 }
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: "Failed to fetch from Google Calendar" },
                { status: response.status }
            );
        }

        const icsText = await response.text();
        return new NextResponse(icsText, {
            status: 200,
            headers: { 'Content-Type': 'text/calendar' }
        });

    } catch (error) {
        console.error('API Error fetching Calendar:', error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
