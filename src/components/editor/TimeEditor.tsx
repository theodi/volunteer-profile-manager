"use client";

import { useCallback } from "react";
import type { PreferredTime } from "@/ldo/volunteer.typings";
import { DAYS_OF_WEEK, TIMES_OF_DAY } from "../ProfileEditor";

interface TimeEditorProps {
  times: PreferredTime[];
  onChange: (times: PreferredTime[]) => void;
}

export default function TimeEditor({ times, onChange }: TimeEditorProps) {
  // Create a grid of selected time slots
  const isSelected = useCallback(
    (dayId: string, timeId: string) => {
      return times.some(
        (t) => t.day?.["@id"] === dayId && t.time?.["@id"] === timeId
      );
    },
    [times]
  );

  const toggleTimeSlot = useCallback(
    (dayId: string, timeId: string) => {
      const existing = times.findIndex(
        (t) => t.day?.["@id"] === dayId && t.time?.["@id"] === timeId
      );

      if (existing >= 0) {
        // Remove
        onChange(times.filter((_, i) => i !== existing));
      } else {
        // Add
        const newTime: PreferredTime = {
          day: { "@id": dayId } as any,
          time: { "@id": timeId } as any,
        };
        onChange([...times, newTime]);
      }
    },
    [times, onChange]
  );

  const selectAllForDay = useCallback(
    (dayId: string) => {
      const newTimes = [...times];
      TIMES_OF_DAY.forEach((time) => {
        const exists = newTimes.some(
          (t) => t.day?.["@id"] === dayId && t.time?.["@id"] === time.id
        );
        if (!exists) {
          newTimes.push({
            day: { "@id": dayId } as any,
            time: { "@id": time.id } as any,
          });
        }
      });
      onChange(newTimes);
    },
    [times, onChange]
  );

  const clearAllForDay = useCallback(
    (dayId: string) => {
      onChange(times.filter((t) => t.day?.["@id"] !== dayId));
    },
    [times, onChange]
  );

  const selectAllForTime = useCallback(
    (timeId: string) => {
      const newTimes = [...times];
      DAYS_OF_WEEK.forEach((day) => {
        const exists = newTimes.some(
          (t) => t.day?.["@id"] === day.id && t.time?.["@id"] === timeId
        );
        if (!exists) {
          newTimes.push({
            day: { "@id": day.id } as any,
            time: { "@id": timeId } as any,
          });
        }
      });
      onChange(newTimes);
    },
    [times, onChange]
  );

  const selectAll = useCallback(() => {
    const newTimes: PreferredTime[] = [];
    DAYS_OF_WEEK.forEach((day) => {
      TIMES_OF_DAY.forEach((time) => {
        newTimes.push({
          day: { "@id": day.id } as any,
          time: { "@id": time.id } as any,
        });
      });
    });
    onChange(newTimes);
  }, [onChange]);

  const clearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Availability</h2>
          <p className="text-sm text-gray-600 mt-1">
            Select the times when you&apos;re available to volunteer.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          >
            Select all
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Time grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-left text-sm font-medium text-gray-600"></th>
              {TIMES_OF_DAY.map((time) => (
                <th key={time.id} className="p-3 text-center">
                  <button
                    onClick={() => selectAllForTime(time.id)}
                    className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                  >
                    {time.label}
                  </button>
                </th>
              ))}
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {DAYS_OF_WEEK.map((day) => {
              const daySlots = TIMES_OF_DAY.filter((time) =>
                isSelected(day.id, time.id)
              ).length;
              const allSelected = daySlots === TIMES_OF_DAY.length;

              return (
                <tr key={day.id} className="border-t border-gray-100">
                  <td className="p-3">
                    <button
                      onClick={() =>
                        allSelected
                          ? clearAllForDay(day.id)
                          : selectAllForDay(day.id)
                      }
                      className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                    >
                      {day.label}
                    </button>
                  </td>
                  {TIMES_OF_DAY.map((time) => {
                    const selected = isSelected(day.id, time.id);
                    return (
                      <td key={time.id} className="p-3 text-center">
                        <button
                          onClick={() => toggleTimeSlot(day.id, time.id)}
                          className={`w-10 h-10 rounded-lg transition-all ${
                            selected
                              ? "bg-purple-600 text-white shadow-sm"
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          }`}
                          aria-label={`${day.label} ${time.label}`}
                          aria-pressed={selected}
                        >
                          {selected ? "✓" : ""}
                        </button>
                      </td>
                    );
                  })}
                  <td className="p-3 text-center">
                    <span className="text-xs text-gray-500">
                      {daySlots}/{TIMES_OF_DAY.length}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="p-4 bg-purple-50 rounded-lg">
        <p className="text-sm text-purple-800">
          <span className="font-medium">{times.length}</span> time slot
          {times.length !== 1 ? "s" : ""} selected
        </p>
        {times.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const dayTimes = times.filter((t) => t.day?.["@id"] === day.id);
              if (dayTimes.length === 0) return null;
              return (
                <span
                  key={day.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700"
                >
                  {day.label.slice(0, 3)}:{" "}
                  {dayTimes.map((t) => t.time?.["@id"]?.slice(0, 1)).join(", ")}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
