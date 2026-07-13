package normalize

import (
	"strings"
	"testing"
)

func TestCSVNormalizesRows(t *testing.T) {
	rows, err := CSV(strings.NewReader("date,description,amount,currency\n2026-07-13,Coffee,-4.50,usd\n"))
	if err != nil {
		t.Fatal(err)
	}
	if len(rows) != 1 || rows[0].AmountMinor != -450 || rows[0].Currency != "USD" {
		t.Fatalf("unexpected rows: %#v", rows)
	}
}

func TestCSVRequiresColumns(t *testing.T) {
	if _, err := CSV(strings.NewReader("date,amount\n2026-07-13,1")); err == nil {
		t.Fatal("expected missing-column error")
	}
}
