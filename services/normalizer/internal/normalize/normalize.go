package normalize

import (
	"encoding/csv"
	"fmt"
	"io"
	"math"
	"strconv"
	"strings"
	"time"
)

type Row struct {
	RowNumber   int               `bson:"rowNumber"`
	Date        time.Time         `bson:"date"`
	Description string            `bson:"description"`
	AmountMinor int64             `bson:"amountMinor"`
	Currency    string            `bson:"currency"`
	Raw         map[string]string `bson:"raw"`
}

func CSV(input io.Reader) ([]Row, error) {
	reader := csv.NewReader(input)
	reader.TrimLeadingSpace = true
	reader.FieldsPerRecord = -1
	header, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("read header: %w", err)
	}
	index := map[string]int{}
	for position, value := range header {
		index[strings.ToLower(strings.TrimSpace(value))] = position
	}
	for _, required := range []string{"date", "description", "amount"} {
		if _, ok := index[required]; !ok {
			return nil, fmt.Errorf("missing required column %q", required)
		}
	}
	rows := []Row{}
	for line := 2; ; line++ {
		record, readErr := reader.Read()
		if readErr == io.EOF {
			break
		}
		if readErr != nil {
			return nil, fmt.Errorf("line %d: %w", line, readErr)
		}
		raw := map[string]string{}
		for key, position := range index {
			if position < len(record) {
				raw[key] = strings.TrimSpace(record[position])
			}
		}
		date, parseErr := parseDate(raw["date"])
		if parseErr != nil {
			return nil, fmt.Errorf("line %d date: %w", line, parseErr)
		}
		amount, parseErr := strconv.ParseFloat(strings.ReplaceAll(raw["amount"], ",", ""), 64)
		if parseErr != nil {
			return nil, fmt.Errorf("line %d amount: %w", line, parseErr)
		}
		currency := strings.ToUpper(raw["currency"])
		if currency == "" {
			currency = "USD"
		}
		rows = append(rows, Row{RowNumber: line, Date: date, Description: raw["description"], AmountMinor: int64(math.Round(amount * 100)), Currency: currency, Raw: raw})
	}
	return rows, nil
}

func parseDate(value string) (time.Time, error) {
	for _, layout := range []string{"2006-01-02", "02/01/2006", "01/02/2006"} {
		if parsed, err := time.Parse(layout, value); err == nil {
			return parsed, nil
		}
	}
	return time.Time{}, fmt.Errorf("unsupported date %q", value)
}
